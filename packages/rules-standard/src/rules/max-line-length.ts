import { LintRule, LintMessage, LintContext } from '@testthedocs/core';

export const maxLineLengthRule: LintRule = {
  name: 'max-line-length',
  description: 'Enforce maximum line length',
  severity: 'warning',
  
  check(document: any, context: LintContext): LintMessage[] {
    const messages: LintMessage[] = [];
    
    // Get max length from config, default to 120
    const maxLength = context.options.rules?.['max-line-length']?.maxLength || 120;
    
    // Get source content if available
    const source = document.getSourceLines?.();
    if (!source) {
      return messages;
    }
    
    for (let i = 0; i < source.length; i++) {
      const line = source[i];
      const lineNumber = i + 1;
      
      if (line.length > maxLength) {
        messages.push({
          rule: 'max-line-length',
          message: `Line is too long (${line.length} > ${maxLength} characters)`,
          severity: 'warning',
          line: lineNumber,
          column: maxLength + 1,
          source: line
        });
      }
    }
    
    return messages;
  }
};