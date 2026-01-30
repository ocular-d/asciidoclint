import { LintRule, LintMessage, LintContext } from '@testthedocs/core';

export const noTrailingSpacesRule: LintRule = {
  name: 'no-trailing-spaces',
  description: 'Disallow trailing whitespace at the end of lines',
  severity: 'warning',
  
  check(document: any, context: LintContext): LintMessage[] {
    const messages: LintMessage[] = [];
    
    // Get source content if available
    const source = document.getSourceLines?.();
    if (!source) {
      return messages;
    }
    
    const severity = context.options.rules?.['no-trailing-spaces'] || 'warning';
    
    for (let i = 0; i < source.length; i++) {
      const line = source[i];
      const lineNumber = i + 1;
      
      // Check if line has trailing spaces or tabs
      if (line.match(/\s+$/)) {
        messages.push({
          rule: 'no-trailing-spaces',
          message: 'Line has trailing whitespace',
          severity,
          line: lineNumber,
          column: line.length,
          source: line
        });
      }
    }
    
    return messages;
  }
};