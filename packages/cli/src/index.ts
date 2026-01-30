#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AsciiDocLinter } from '@asciidoclint/core';
import { loadConfig } from './config';
import { formatResults } from './formatters';
import { glob } from 'glob';
import Debug from 'debug';

const debug = Debug('asciidoclint:cli');
const program = new Command();

program
  .name('asciidoclint')
  .description('AsciiDoc linter for documentation quality')
  .version('1.0.0')
  .argument('[files...]', 'Files to lint (supports glob patterns)', ['**/*.adoc'])
  .option('-c, --config <path>', 'Configuration file path')
  .option('-f, --format <format>', 'Output format', 'stylish')
  .option('--fix', 'Automatically fix problems')
  .option('--quiet', 'Report errors only')
  .option('--max-warnings <number>', 'Number of warnings to trigger nonzero exit code', parseInt)
  .action(async (files, options) => {
    try {
      debug('CLI started with files: %O, options: %O', files, options);
      
      const config = await loadConfig(options.config);
      const linter = new AsciiDocLinter(config);
      
      // Load standard rules
      const { loadStandardRules } = await import('@asciidoclint/rules-standard');
      loadStandardRules(linter);
      
      const allFiles: string[] = [];
      for (const pattern of files) {
        const matchedFiles = await glob(pattern, {
          ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        allFiles.push(...matchedFiles);
      }
      
      if (allFiles.length === 0) {
        console.log(chalk.yellow('No files found matching the specified patterns.'));
        process.exit(0);
      }
      
      console.log(chalk.blue(`Linting ${allFiles.length} files...`));
      
      const results = [];
      for (const file of allFiles) {
        const result = await linter.lintFile(file);
        results.push(result);
      }
      
      const output = formatResults(results, options.format);
      console.log(output);
      
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
      const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
      
      console.log(chalk.bold(`\n✨ ${allFiles.length} files linted`));
      console.log(chalk.red(`❌ ${totalErrors} errors`));
      console.log(chalk.yellow(`⚠️  ${totalWarnings} warnings`));
      
      // Exit with error code if there are issues
      if (totalErrors > 0) {
        process.exit(1);
      } else if (options.maxWarnings !== undefined && totalWarnings > options.maxWarnings) {
        console.log(chalk.red(`Maximum warnings exceeded: ${totalWarnings} > ${options.maxWarnings}`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
      debug('CLI error: %O', error);
      process.exit(1);
    }
  });

program.parse();