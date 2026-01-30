import asciidoctor from '@asciidoctor/core';
import Debug from 'debug';
import { LintRule, LintContext, LintResult, LintMessage, LintConfig } from './types/index';
import { DirectiveManager } from './directive-manager';

const debug = Debug('asciidoclint:core');

export class AsciiDocLinter {
  private rules: Map<string, LintRule> = new Map();
  private config: LintConfig;
  private asciidoc = asciidoctor();

  constructor(config: LintConfig = { rules: {} }) {
    // Set default for enableInlineDirectives if not specified
    const configWithDefaults = config as LintConfig & { enableInlineDirectives?: boolean };
    if (configWithDefaults.enableInlineDirectives === undefined) {
      configWithDefaults.enableInlineDirectives = true;
    }
    this.config = configWithDefaults;
    debug('Linter initialized with config: %O', config);
  }

  addRule(rule: LintRule): void {
    this.rules.set(rule.name, rule);
    debug('Added rule: %s', rule.name);
  }

  removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
    debug('Removed rule: %s', ruleName);
  }

  lintText(content: string, filename?: string): LintResult {
    debug('Linting content for file: %s', filename || 'unnamed');
    
    const document = this.asciidoc.load(content);
    const messages: LintMessage[] = [];
    let errorCount = 0;
    let warningCount = 0;

    // Initialize directive manager if enabled
    let directiveManager: DirectiveManager | undefined;
    const configWithDirectives = this.config as LintConfig & { enableInlineDirectives?: boolean };
    if (configWithDirectives.enableInlineDirectives !== false) {
      const ruleNames = Array.from(this.rules.keys());
      directiveManager = new DirectiveManager(ruleNames);
      
      // Parse directives from source lines
      const lines = content.split('\n');
      const contentHash = DirectiveManager.generateContentHash(content);
      const directiveMessages = directiveManager.parseDirectives(lines, contentHash);
      
      // Add directive warnings to messages
      messages.push(...directiveMessages);
      directiveMessages.forEach(msg => {
        if (msg.severity === 'error') errorCount++;
        else if (msg.severity === 'warning') warningCount++;
      });
      
      debug('Parsed %d directives with %d warnings', 
            directiveManager.getDirectiveLines().length, 
            directiveMessages.length);
    }

    const context: LintContext & { directiveManager?: DirectiveManager } = {
      filename,
      options: this.config,
      directiveManager
    };

    for (const [ruleName, rule] of this.rules) {
      const ruleConfig = this.config.rules[ruleName];
      
      if (ruleConfig === 'off') {
        continue;
      }

      try {
        const ruleMessages = rule.check(document, context);
        
        for (const message of ruleMessages) {
          // Skip messages for directive lines
          if (directiveManager && message.line && directiveManager.isDirectiveLine(message.line)) {
            debug('Skipping message for directive line %d', message.line);
            continue;
          }

          // Skip messages for disabled rules
          if (directiveManager && message.line && directiveManager.isRuleDisabled(ruleName, message.line)) {
            debug('Skipping message for disabled rule %s on line %d', ruleName, message.line);
            continue;
          }

          // Override severity based on config
          const severity = ruleConfig || rule.severity;
          const lintMessage: LintMessage = {
            ...message,
            severity
          };

          messages.push(lintMessage);

          if (severity === 'error') {
            errorCount++;
          } else if (severity === 'warning') {
            warningCount++;
          }
        }
      } catch (error) {
        debug('Error running rule %s: %O', ruleName, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        messages.push({
          rule: ruleName,
          message: `Rule error: ${errorMessage}`,
          severity: 'error'
        });
        errorCount++;
      }
    }

    const result: LintResult = {
      filename: filename || 'unnamed',
      messages,
      errorCount,
      warningCount
    };

    debug('Linting complete. Errors: %d, Warnings: %d', errorCount, warningCount);
    return result;
  }

  async lintFile(filepath: string): Promise<LintResult> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filepath, 'utf8');
    return this.lintText(content, filepath);
  }
}

export * from './types/index';
export { DirectiveManager } from './directive-manager';
export { AsciiDocLinter as default };