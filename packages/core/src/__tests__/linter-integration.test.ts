import { AsciiDocLinter } from '../index';
import { loadStandardRules } from '@asciidoclint/rules-standard';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AsciiDocLinter with inline directives', () => {
  let linter: AsciiDocLinter;

  beforeEach(() => {
    linter = new AsciiDocLinter({
      rules: {
        'max-line-length': 'warning',
        'no-trailing-spaces': 'warning',
        'title-case': 'error'
      },
      enableInlineDirectives: true
    });
    loadStandardRules(linter);
  });

  describe('Basic directive integration', () => {
    it('should disable rules based on inline directives', () => {
      const content = `= Test Document

This is a normal line.

// adoc-lint disable max-line-length
This line is intentionally way too long and would normally trigger line-length but we are ignoring it. This is very long yes and it should be ignored.
// adoc-lint enable max-line-length

This line is also too long and should trigger max-line-length warning again since the rule is re-enabled.`;

      const result = linter.lintText(content);
      
      // Should have one max-line-length warning (the last line)
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(1);
      expect(maxLengthMessages[0].line).toBe(8); // Last line
    });

    it('should exclude directive lines from rule checking', () => {
      const content = `= Test Document

// adoc-lint disable max-line-length - this comment itself is very long and would normally trigger max-line-length but should be ignored
This line is also long but rule is disabled.
// adoc-lint enable max-line-length - another very long comment that should be ignored from rule checking`;

      const result = linter.lintText(content);
      
      // Should have no max-line-length warnings since directive lines are excluded
      // and the content line is covered by disable/enable
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(0);
    });

    it('should generate warnings for invalid directive syntax', () => {
      const content = `= Test Document

// adoc-lint disable unknown-rule
// adoc-lint disable-all with-args
// adoc-lint enable
Normal content line.`;

      const result = linter.lintText(content);
      
      // Should have warnings for each invalid directive
      const directiveWarnings = result.messages.filter(m => m.rule === 'directive-syntax');
      expect(directiveWarnings).toHaveLength(3);
      
      expect(directiveWarnings[0].line).toBe(3);
      expect(directiveWarnings[0].message).toContain('Unknown rules: unknown-rule');
      
      expect(directiveWarnings[1].line).toBe(4);
      expect(directiveWarnings[1].message).toContain('does not accept rule arguments');
      
      expect(directiveWarnings[2].line).toBe(5);
      expect(directiveWarnings[2].message).toContain('requires rule names');
    });
  });

  describe('Multi-rule directive support', () => {
    it('should handle comma-separated rule lists', () => {
      const content = `= Test Document

// adoc-lint disable max-line-length, no-trailing-spaces
This line is very long and has trailing spaces   
Another long line with trailing spaces    
// adoc-lint enable max-line-length, no-trailing-spaces

This line is also long and has trailing spaces   `;

      const result = linter.lintText(content);
      
      // Should only have violations for the last line (after re-enable)
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      const trailingSpaceMessages = result.messages.filter(m => m.rule === 'no-trailing-spaces');
      
      expect(maxLengthMessages).toHaveLength(1);
      expect(maxLengthMessages[0].line).toBe(8);
      
      expect(trailingSpaceMessages).toHaveLength(1);
      expect(trailingSpaceMessages[0].line).toBe(8);
    });

    it('should handle disable-all and enable-all directives', () => {
      const content = `= Test Document

// adoc-lint disable-all
This line is very long and has trailing spaces and violates multiple rules   
== improper title case
More problematic content
// adoc-lint enable-all

This line is also long and has trailing spaces   
== another improper title`;

      const result = linter.lintText(content);
      
      // Should only have violations after enable-all
      const allMessages = result.messages.filter(m => m.rule !== 'directive-syntax');
      const messagesAfterEnableAll = allMessages.filter(m => m.line && m.line > 7);
      
      expect(messagesAfterEnableAll.length).toBeGreaterThan(0);
      
      // Should have no violations in the disabled section (lines 4-6)
      const messagesInDisabledSection = allMessages.filter(m => m.line && m.line >= 4 && m.line <= 6);
      expect(messagesInDisabledSection).toHaveLength(0);
    });
  });

  describe('Priority and nesting behavior', () => {
    it('should handle specific rule overriding disable-all', () => {
      const content = `= Test Document

// adoc-lint disable-all
// adoc-lint enable max-line-length
This line is very long but only max-line-length should be enabled
Has trailing spaces but that rule is still disabled   `;

      const result = linter.lintText(content);
      
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      const trailingSpaceMessages = result.messages.filter(m => m.rule === 'no-trailing-spaces');
      
      expect(maxLengthMessages).toHaveLength(1);
      expect(trailingSpaceMessages).toHaveLength(0); // Still disabled by disable-all override
    });

    it('should handle complex nesting scenarios', () => {
      const content = `= Test Document

Line 2: Normal content
// adoc-lint disable-all
Line 4: All rules disabled - long line with spaces   
// adoc-lint enable max-line-length  
Line 6: Only max-line-length enabled - long line with spaces   
// adoc-lint disable max-line-length, no-trailing-spaces
Line 8: Specific rules disabled - long line with spaces   
// adoc-lint enable-all
Line 10: All enabled - long line with spaces   `;

      const result = linter.lintText(content);
      
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      const trailingSpaceMessages = result.messages.filter(m => m.rule === 'no-trailing-spaces');
      
      // Should have max-line-length violations only on lines 6 and 10
      expect(maxLengthMessages).toHaveLength(2);
      expect(maxLengthMessages.map(m => m.line).sort()).toEqual([6, 10]);
      
      // Should have trailing-spaces violations only on line 10 (after enable-all)
      expect(trailingSpaceMessages).toHaveLength(1);
      expect(trailingSpaceMessages[0].line).toBe(10);
    });
  });

  describe('Configuration options', () => {
    it('should respect enableInlineDirectives: false', () => {
      const linterWithoutDirectives = new AsciiDocLinter({
        rules: {
          'max-line-length': 'warning'
        },
        enableInlineDirectives: false
      });
      loadStandardRules(linterWithoutDirectives);

      const content = `= Test Document

// adoc-lint disable max-line-length
This line is very long but directives are disabled so it should trigger warning.`;

      const result = linterWithoutDirectives.lintText(content);
      
      // Should have max-line-length warning since directives are disabled
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(1);
      
      // Should have no directive warnings since processing is disabled
      const directiveMessages = result.messages.filter(m => m.rule === 'directive-syntax');
      expect(directiveMessages).toHaveLength(0);
    });

    it('should default to enableInlineDirectives: true', () => {
      const defaultLinter = new AsciiDocLinter({
        rules: { 'max-line-length': 'warning' }
      });
      loadStandardRules(defaultLinter);

      const content = `= Test Document

// adoc-lint disable max-line-length
This line is very long but should be ignored due to directive.`;

      const result = defaultLinter.lintText(content);
      
      // Should have no max-line-length warnings since directive should be processed
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(0);
    });
  });

  describe('Error recovery', () => {
    it('should continue processing after directive warnings', () => {
      const content = `= Test Document

// adoc-lint disable invalid-rule
// adoc-lint disable max-line-length
This line is very long but max-line-length should be disabled despite the previous invalid directive.`;

      const result = linter.lintText(content);
      
      // Should have directive warning for invalid rule
      const directiveWarnings = result.messages.filter(m => m.rule === 'directive-syntax');
      expect(directiveWarnings).toHaveLength(1);
      expect(directiveWarnings[0].line).toBe(3);
      
      // Should still process valid directive and disable max-line-length
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(0);
    });

    it('should handle mixed valid and invalid directives', () => {
      const content = `= Test Document

// adoc-lint disable max-line-length, invalid-rule, no-trailing-spaces
This line is long and has trailing spaces but both valid rules should be disabled   `;

      const result = linter.lintText(content);
      
      // Should have directive warning for invalid rule
      const directiveWarnings = result.messages.filter(m => m.rule === 'directive-syntax');
      expect(directiveWarnings).toHaveLength(1);
      expect(directiveWarnings[0].message).toContain('Unknown rules: invalid-rule');
      
      // Despite the invalid rule, no rule violations should be disabled
      // since the entire directive is marked invalid due to unknown rule
      const ruleMessages = result.messages.filter(m => m.rule !== 'directive-syntax');
      expect(ruleMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with existing rules', () => {
    it('should work with max-line-length rule', () => {
      const content = `= Test Document

This line is within normal length limits.
// adoc-lint disable max-line-length  
This line is intentionally very long and exceeds the maximum line length limit but should be ignored due to the disable directive.
// adoc-lint enable max-line-length
This line is also very long and exceeds the maximum line length limit and should trigger a warning.`;

      const result = linter.lintText(content);
      
      const maxLengthMessages = result.messages.filter(m => m.rule === 'max-line-length');
      expect(maxLengthMessages).toHaveLength(1);
      expect(maxLengthMessages[0].line).toBe(7); // Last line
    });

    it('should work with no-trailing-spaces rule', () => {
      const content = `= Test Document

This line has no trailing spaces.
// adoc-lint disable no-trailing-spaces
This line has trailing spaces but should be ignored.   
// adoc-lint enable no-trailing-spaces  
This line also has trailing spaces and should trigger warning.   `;

      const result = linter.lintText(content);
      
      const trailingSpaceMessages = result.messages.filter(m => m.rule === 'no-trailing-spaces');
      expect(trailingSpaceMessages).toHaveLength(1);
      expect(trailingSpaceMessages[0].line).toBe(7); // Last line
    });

    it('should work with title-case rule', () => {
      const content = `= Test Document

== Properly Formatted Title

// adoc-lint disable title-case
== improperly formatted title
// adoc-lint enable title-case

== another improperly formatted title`;

      const result = linter.lintText(content);
      
      const titleCaseMessages = result.messages.filter(m => m.rule === 'title-case');
      expect(titleCaseMessages).toHaveLength(1);
      expect(titleCaseMessages[0].line).toBe(9); // Last title
    });
  });
});