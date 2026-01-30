import { LintResult } from '@testthedocs/core';
import chalk from 'chalk';

export function formatResults(results: LintResult[], format: string = 'stylish'): string {
  switch (format) {
    case 'stylish':
      return formatStylish(results);
    case 'json':
      return JSON.stringify(results, null, 2);
    case 'compact':
      return formatCompact(results);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

function formatStylish(results: LintResult[]): string {
  let output = '';
  
  for (const result of results) {
    if (result.messages.length === 0) continue;
    
    output += chalk.underline(result.filename) + '\n';
    
    for (const message of result.messages) {
      const line = message.line || 0;
      const column = message.column || 0;
      const position = `${line}:${column}`;
      
      let color = chalk.gray;
      let symbol = ' ';
      
      switch (message.severity) {
        case 'error':
          color = chalk.red;
          symbol = '✖';
          break;
        case 'warning':
          color = chalk.yellow;
          symbol = '⚠';
          break;
        case 'info':
          color = chalk.blue;
          symbol = 'ℹ';
          break;
      }
      
      output += `  ${color(position.padEnd(8))} ${color(symbol)} ${message.message} ${chalk.gray(message.rule)}\n`;
    }
    
    output += '\n';
  }
  
  return output;
}

function formatCompact(results: LintResult[]): string {
  let output = '';
  
  for (const result of results) {
    for (const message of result.messages) {
      const line = message.line || 0;
      const column = message.column || 0;
      const severity = message.severity.toUpperCase();
      
      output += `${result.filename}:${line}:${column}: ${severity} - ${message.message} (${message.rule})\n`;
    }
  }
  
  return output;
}