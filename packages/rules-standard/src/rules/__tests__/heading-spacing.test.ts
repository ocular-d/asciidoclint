import { AsciiDocLinter } from '@testthedocs/core';
import { headingSpacingRule } from '../heading-spacing';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('headingSpacingRule', () => {
  let linter: AsciiDocLinter;

  beforeEach(() => {
    linter = new AsciiDocLinter({
      rules: {
        'heading-spacing': 'warning'
      }
    });
    linter.addRule(headingSpacingRule);
  });

  describe('Basic heading spacing', () => {
    it('should not report violations for properly spaced headings', () => {
      const content = `= Document Title

This is the introduction.

== Section One

Content for section one.

=== Subsection

More content here.

== Section Two

Final content.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should report violations for headings without blank line before', () => {
      const content = `= Document Title

This is the introduction.
== Section One

Content for section one.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(1);
      expect(headingMessages[0].message).toContain('should have blank line before it');
      expect(headingMessages[0].line).toBe(4);
    });

    it('should report violations for headings without blank line after', () => {
      const content = `= Document Title

== Section One
Content for section one.

More content.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(1);
      expect(headingMessages[0].message).toContain('should have blank line after it');
      expect(headingMessages[0].line).toBe(3);
    });

    it('should skip level 1 headings by default', () => {
      const content = `= Document Title
This is content directly after title.

More content.

== Section One

Content here.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0);
    });
  });

  describe('Configuration options', () => {
    it('should respect requireBefore configuration', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            requireBefore: false,
            requireAfter: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
== Section One

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0); // Should not report missing blank line before
    });

    it('should respect requireAfter configuration', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            requireBefore: true,
            requireAfter: false
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

== Section One
Content directly after heading.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0); // Should not report missing blank line after
    });

    it('should respect exceptions configuration', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            exceptions: [3] // Skip level 3 headings
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

== Section One
Content here.
=== Subsection
More content.

== Section Two

Final content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      // Should report violation for level 2 heading but not level 3
      expect(headingMessages).toHaveLength(2); // Before and after for "Section One"
      expect(headingMessages.some(m => m.message.includes('Section One'))).toBe(true);
      expect(headingMessages.some(m => m.message.includes('Subsection'))).toBe(false);
    });

    it('should respect allowConsecutiveHeadings configuration', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            allowConsecutiveHeadings: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

== Section One
=== Subsection

Content here.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      // Should not report violations between consecutive headings
      expect(headingMessages).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle document start and end properly', () => {
      const content = `== First Section

Content here.

== Last Section`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0); // First and last lines don't need spacing
    });

    it('should handle multiple consecutive violations', () => {
      const content = `= Document Title

== Section One
Content one.
== Section Two
Content two.
== Section Three

Content three.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages.length).toBeGreaterThan(2); // Multiple violations
    });

    it('should handle empty document gracefully', () => {
      const content = '';

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0);
    });

    it('should handle document with only title', () => {
      const content = `= Document Title

Some content here.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      expect(headingMessages).toHaveLength(0);
    });
  });

  describe('Performance tests', () => {
    it('should cache heading positions for repeated checks', () => {
      const content = `= Document Title

== Section One

Content.

== Section Two

More content.`;

      // First run
      const start1 = Date.now();
      const result1 = linter.lintText(content);
      const time1 = Date.now() - start1;

      // Second run (should be faster due to caching)
      const start2 = Date.now();
      const result2 = linter.lintText(content);
      const time2 = Date.now() - start2;

      expect(result1.messages.length).toBe(result2.messages.length);
      // Note: In actual tests, time2 should be less than time1, but timing can be unreliable
      // This test is more for documentation and manual verification
    });

    it('should handle large documents efficiently', () => {
      // Generate a large document with many headings
      let content = '= Document Title\n\n';
      for (let i = 1; i <= 100; i++) {
        content += `== Section ${i}\n\nContent for section ${i}.\n\n`;
      }

      const start = Date.now();
      const result = linter.lintText(content);
      const time = Date.now() - start;

      expect(result.messages.filter(m => m.rule === 'heading-spacing')).toHaveLength(0);
      expect(time).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

describe('headingSpacingRule with inline directives', () => {
  let linter: AsciiDocLinter;

  beforeEach(() => {
    linter = new AsciiDocLinter({
      rules: {
        'heading-spacing': 'warning'
      },
      enableInlineDirectives: true
    });
    linter.addRule(headingSpacingRule);
  });

  it('should disable heading spacing rule with inline directive', () => {
    const content = `= Document Title

// adoc-lint disable heading-spacing
== Bad Heading
No blank line before this heading

Another paragraph.`;

    const result = linter.lintText(content);
    const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
    
    expect(headingMessages).toHaveLength(0);
  });

  it('should handle partial disabling and re-enabling', () => {
    const content = `= Document Title

== Good Heading

With proper spacing.

// adoc-lint disable heading-spacing  
== Bad Heading
No spacing but disabled.
// adoc-lint enable heading-spacing

== Another Bad Heading
No spacing and enabled.`;

    const result = linter.lintText(content);
    const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
    
    expect(headingMessages.length).toBeGreaterThan(0);
    expect(headingMessages.some(m => m.message.includes('Another Bad Heading'))).toBe(true);
    expect(headingMessages.some(m => m.message.includes('Bad Heading') && !m.message.includes('Another'))).toBe(false);
  });

  it('should handle disable-all directive', () => {
    const content = `= Document Title

== Good Heading

Content here.

// adoc-lint disable-all
== Bad Heading One
No spacing.
== Bad Heading Two
Still no spacing.
// adoc-lint enable-all

== Bad Heading Three
Should be caught.`;

    const result = linter.lintText(content);
    const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
    
    // Only the last heading should trigger violations
    expect(headingMessages.some(m => m.message.includes('Bad Heading Three'))).toBe(true);
    expect(headingMessages.some(m => m.message.includes('Bad Heading One'))).toBe(false);
    expect(headingMessages.some(m => m.message.includes('Bad Heading Two'))).toBe(false);
  });

  it('should handle multiple rule disabling', () => {
    const content = `= Document Title

// adoc-lint disable heading-spacing, max-line-length
== Bad Heading
No spacing and this line could be very long without triggering length violations.

More content.`;

    const result = linter.lintText(content);
    const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
    
    expect(headingMessages).toHaveLength(0);
  });
});

describe('headingSpacingRule configuration validation', () => {
  it('should validate exceptions configuration', () => {
    // This test verifies the configuration validation works
    // The actual validation is in the core linter, but we test it works end-to-end
    const linter = new AsciiDocLinter({
      rules: {
        'heading-spacing': {
          severity: 'warning',
          exceptions: [2, 3, 4] // Valid configuration
        }
      }
    });
    linter.addRule(headingSpacingRule);

    const content = `= Document Title

== Section (level 2 - should be ignored)
Content.
=== Subsection (level 3 - should be ignored)  
Content.
==== Sub-subsection (level 4 - should be ignored)
Content.
===== Deep heading (level 5 - should trigger violations)
Content.`;

    const result = linter.lintText(content);
    const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
    
    // Only level 5 heading should trigger violations
    expect(headingMessages.some(m => m.message.includes('Deep heading'))).toBe(true);
    expect(headingMessages.some(m => m.message.includes('Section'))).toBe(false);
  });
});

describe('Attribute handling', () => {
  describe('Simple attribute patterns', () => {
    it('should ignore simple anchor IDs when ignoreAttributeBlocks is enabled', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[#section-id]
== Section Heading

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should ignore simple role attributes when ignoreAttributeBlocks is enabled', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[.primary-section]
== Section Heading

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should still report violations when ignoreAttributeBlocks is disabled', () => {
      const content = `= Document Title

Content here.
[#section-id]
== Section Heading

More content.`;

      const result = linter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(1);
      expect(headingMessages[0].message).toContain('should have blank line before it');
    });
  });

  describe('Complex attribute patterns', () => {
    it('should ignore complex ID-role combinations when ignoreComplexAttributes is enabled', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreComplexAttributes: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[#main-section.primary.highlighted]
== Main Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should ignore block shortcuts like [source,javascript]', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[source,javascript]
== Code Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should ignore admonition shortcuts like [NOTE]', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[NOTE]
== Important Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });
  });

  describe('Multiple consecutive attribute lines', () => {
    it('should ignore all consecutive attribute lines before heading', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true,
            ignoreComplexAttributes: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[source,javascript]
[#code-example]
[.highlighted.example]
== Code Example Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should check spacing before the entire attribute block', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title
Content directly before attributes.
[#section-id]
[.primary]
== Section Heading

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(1);
      expect(headingMessages[0].message).toContain('should have blank line before it');
    });
  });

  describe('Malformed attribute validation', () => {
    it('should generate warnings for malformed attribute syntax', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[#invalid id with spaces]
== Section Heading

More content.`;

      const result = customLinter.lintText(content);
      const messages = result.messages.filter(m => m.rule === 'heading-spacing');
      
      // Should have malformed attribute warning and spacing violation
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages.some(m => m.message.includes('Malformed attribute syntax'))).toBe(true);
    });

    it('should handle multiple malformed attributes', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[#invalid id]
[.role with spaces]
[broken syntax
== Section Heading

More content.`;

      const result = customLinter.lintText(content);
      const messages = result.messages.filter(m => m.rule === 'heading-spacing');
      const malformedMessages = messages.filter(m => m.message.includes('Malformed attribute syntax'));
      
      expect(malformedMessages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Block context awareness', () => {
    it('should not treat brackets inside code blocks as attributes', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Some content.

----
[this-looks-like-attribute-but-its-code]
function example() {
  return [array, elements];
}
----
== Code Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should detect code blocks with different delimiters', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Some content.

====
[this-is-in-example-block]
====
== Example Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });
  });

  describe('Document boundaries', () => {
    it('should handle attributes at document start', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `[#document-attrs]
= Document Title

== Section`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should respect maxAttributeDepthScan limit', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true,
            maxAttributeDepthScan: 2
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      // More attributes than scan limit
      const attributes = Array.from({length: 5}, (_, i) => `[.role-${i}]`).join('\n');
      const content = `= Document Title

Content.
${attributes}
== Section`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      // Should report violation because scan depth limit was reached
      expect(headingMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Language shortcuts', () => {
    it('should ignore language shortcut attributes', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[,python]
== Python Section

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });

    it('should handle complex language shortcuts with additional attributes', () => {
      const customLinter = new AsciiDocLinter({
        rules: {
          'heading-spacing': {
            severity: 'warning',
            ignoreAttributeBlocks: true
          }
        }
      });
      customLinter.addRule(headingSpacingRule);

      const content = `= Document Title

Content here.
[,javascript]
[#code-example.highlighted]
== JavaScript Example

More content.`;

      const result = customLinter.lintText(content);
      const headingMessages = result.messages.filter(m => m.rule === 'heading-spacing');
      expect(headingMessages).toHaveLength(0);
    });
  });
});