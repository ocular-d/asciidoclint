import { LintRule, LintMessage, LintContext } from '@asciidoclint/core';

export const titleCaseRule: LintRule = {
  name: 'title-case',
  description: 'Enforce title case for document and section titles',
  severity: 'warning',
  
  check(document: any, context: LintContext): LintMessage[] {
    const messages: LintMessage[] = [];
    
    // Check document title
    const title = document.getTitle();
    if (title && !isProperTitleCase(title)) {
      messages.push({
        rule: 'title-case',
        message: `Document title should use proper title case: "${title}"`,
        severity: 'warning',
        line: 1
      });
    }
    
    // Check section titles
    const sections = document.findBy({ context: 'section' });
    for (const section of sections) {
      const sectionTitle = section.getTitle();
      if (sectionTitle && !isProperTitleCase(sectionTitle)) {
        messages.push({
          rule: 'title-case',
          message: `Section title should use proper title case: "${sectionTitle}"`,
          severity: 'warning',
          line: section.getLineNumber?.() || 0
        });
      }
    }
    
    return messages;
  }
};

function isProperTitleCase(text: string): boolean {
  const words = text.split(/\s+/);
  
  // Articles, conjunctions, and prepositions that should be lowercase (unless first/last word)
  const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isFirstOrLast = i === 0 || i === words.length - 1;
    
    if (isFirstOrLast) {
      // First and last words should be capitalized
      if (word[0] !== word[0].toUpperCase()) {
        return false;
      }
    } else if (lowercaseWords.includes(word.toLowerCase())) {
      // Small words should be lowercase (unless first/last)
      if (word !== word.toLowerCase()) {
        return false;
      }
    } else {
      // Other words should be capitalized
      if (word[0] !== word[0].toUpperCase()) {
        return false;
      }
    }
  }
  
  return true;
}