import { DirectiveManager } from '../directive-manager';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('DirectiveManager', () => {
  let manager: DirectiveManager;

  beforeEach(() => {
    manager = new DirectiveManager(['max-line-length', 'no-trailing-spaces', 'title-case']);
    DirectiveManager.clearCache();
  });

  describe('Basic directive parsing', () => {
    it('should parse disable directive correctly', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length',
        'Very long line that would normally trigger max-line-length',
        'Another line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('max-line-length', 4)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 3)).toBe(false);
    });

    it('should parse enable directive correctly', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length',
        'Very long line',
        '// adoc-lint enable max-line-length',
        'Another line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('max-line-length', 5)).toBe(false);
    });

    it('should parse disable-all directive correctly', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable-all',
        'Problem line',
        'Another problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 3)).toBe(true);
      expect(manager.isRuleDisabled('title-case', 4)).toBe(true);
    });

    it('should parse enable-all directive correctly', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable-all',
        'Problem line',
        '// adoc-lint enable-all',
        'Another line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('max-line-length', 5)).toBe(false);
    });
  });

  describe('Multiple rule support', () => {
    it('should handle comma-separated rules', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length, no-trailing-spaces',
        'Problem line',
        'Another problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 3)).toBe(true);
      expect(manager.isRuleDisabled('title-case', 3)).toBe(false);
    });

    it('should handle rules with extra whitespace', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable  max-line-length , no-trailing-spaces  ',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 3)).toBe(true);
    });
  });

  describe('Priority and nesting', () => {
    it('should handle specific rule overriding disable-all', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable-all',
        '// adoc-lint enable max-line-length',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 4)).toBe(false);
      expect(manager.isRuleDisabled('no-trailing-spaces', 4)).toBe(false); // enable-all cleared disable-all
      expect(manager.isRuleDisabled('title-case', 4)).toBe(false);
    });

    it('should handle specific rule overriding enable-all', () => {
      const lines = [
        'Some content',
        '// adoc-lint enable-all',
        '// adoc-lint disable max-line-length',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 4)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 4)).toBe(false);
    });

    it('should handle complex nesting scenarios', () => {
      const lines = [
        'Line 1',
        '// adoc-lint disable-all',
        'Line 3 - all disabled',
        '// adoc-lint enable max-line-length',
        'Line 5 - max-line-length enabled, others disabled',
        '// adoc-lint disable max-line-length, no-trailing-spaces',
        'Line 7 - specific rules disabled',
        '// adoc-lint enable-all',
        'Line 9 - all enabled'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);

      // Line 3 - all disabled
      expect(manager.isRuleDisabled('max-line-length', 3)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 3)).toBe(true);

      // Line 5 - after enable max-line-length (overrides disable-all)
      expect(manager.isRuleDisabled('max-line-length', 5)).toBe(false);
      expect(manager.isRuleDisabled('no-trailing-spaces', 5)).toBe(false);

      // Line 7 - specific rules disabled
      expect(manager.isRuleDisabled('max-line-length', 7)).toBe(true);
      expect(manager.isRuleDisabled('no-trailing-spaces', 7)).toBe(true);
      expect(manager.isRuleDisabled('title-case', 7)).toBe(false);

      // Line 9 - all enabled
      expect(manager.isRuleDisabled('max-line-length', 9)).toBe(false);
      expect(manager.isRuleDisabled('no-trailing-spaces', 9)).toBe(false);
    });
  });

  describe('Error handling and warnings', () => {
    it('should warn for unknown rule names', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable unknown-rule',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        rule: 'directive-syntax',
        message: expect.stringContaining('Unknown rules: unknown-rule'),
        severity: 'warning',
        line: 2,
        column: 1
      });
    });

    it('should warn for mixed valid and invalid rules', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length, invalid-rule, no-trailing-spaces',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('Unknown rules: invalid-rule');
    });

    it('should warn for disable-all with rule arguments', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable-all max-line-length',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('does not accept rule arguments');
    });

    it('should warn for enable-all with rule arguments', () => {
      const lines = [
        'Some content',
        '// adoc-lint enable-all some-rule',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('does not accept rule arguments');
    });

    it('should warn for disable without rule arguments', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('requires rule names');
    });

    it('should warn for enable without rule arguments', () => {
      const lines = [
        'Some content',
        '// adoc-lint enable',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('requires rule names');
    });

    it('should warn for malformed syntax but continue processing', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable unknown-rule',
        '// adoc-lint disable max-line-length',
        'Problem line'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].line).toBe(2);
      
      // Should still process valid directive
      expect(manager.isRuleDisabled('max-line-length', 4)).toBe(true);
    });
  });

  describe('Directive line detection', () => {
    it('should identify directive lines correctly', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length',
        'Problem line',
        '// adoc-lint enable max-line-length',
        'Normal line'
      ];

      manager.parseDirectives(lines);
      expect(manager.isDirectiveLine(1)).toBe(false);
      expect(manager.isDirectiveLine(2)).toBe(true);
      expect(manager.isDirectiveLine(3)).toBe(false);
      expect(manager.isDirectiveLine(4)).toBe(true);
      expect(manager.isDirectiveLine(5)).toBe(false);
    });

    it('should return directive lines list', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length',
        'Problem line',
        '// adoc-lint enable max-line-length',
        'Normal line'
      ];

      manager.parseDirectives(lines);
      expect(manager.getDirectiveLines()).toEqual([2, 4]);
    });
  });

  describe('Caching', () => {
    it('should cache directive parsing results', () => {
      const lines = [
        'Some content',
        '// adoc-lint disable max-line-length',
        'Problem line'
      ];

      const content = lines.join('\n');
      const hash = DirectiveManager.generateContentHash(content);

      // First parse
      const warnings1 = manager.parseDirectives(lines, hash);
      expect(warnings1).toHaveLength(0);

      // Create new manager with same hash - should use cache
      const manager2 = new DirectiveManager(['max-line-length', 'no-trailing-spaces', 'title-case']);
      const warnings2 = manager2.parseDirectives(lines, hash);
      
      expect(warnings2).toHaveLength(0);
      expect(manager2.isRuleDisabled('max-line-length', 3)).toBe(true);
    });

    it('should generate consistent content hashes', () => {
      const content1 = 'line1\nline2\nline3';
      const content2 = 'line1\nline2\nline3';
      const content3 = 'line1\nline2\nline4';

      expect(DirectiveManager.generateContentHash(content1))
        .toBe(DirectiveManager.generateContentHash(content2));
      expect(DirectiveManager.generateContentHash(content1))
        .not.toBe(DirectiveManager.generateContentHash(content3));
    });

    it('should clear cache properly', () => {
      const lines = ['// adoc-lint disable max-line-length'];
      const hash = 'test-hash';

      manager.parseDirectives(lines, hash);
      DirectiveManager.clearCache();

      // After cache clear, should not have cached results
      const manager2 = new DirectiveManager(['max-line-length']);
      const warnings = manager2.parseDirectives(lines, hash);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty lines array', () => {
      const warnings = manager.parseDirectives([]);
      expect(warnings).toHaveLength(0);
      expect(manager.isRuleDisabled('max-line-length', 1)).toBe(false);
    });

    it('should handle lines with only directives', () => {
      const lines = [
        '// adoc-lint disable max-line-length',
        '// adoc-lint enable max-line-length'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.isDirectiveLine(1)).toBe(true);
      expect(manager.isDirectiveLine(2)).toBe(true);
    });

    it('should handle directive-like comments that are not directives', () => {
      const lines = [
        '// This is just a comment about adoc-lint',
        '// lint disable - not a proper directive',
        '// adoc-lint invalid-command'
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.getDirectiveLines()).toHaveLength(0);
    });

    it('should handle whitespace variations in directive syntax', () => {
      const lines = [
        '//adoc-lint disable max-line-length',  // no space after //
        '//   adoc-lint   disable   max-line-length  ',  // extra spaces
        '// adoc-lint disable max-line-length',  // normal
      ];

      const warnings = manager.parseDirectives(lines);
      expect(warnings).toHaveLength(0);
      expect(manager.getDirectiveLines()).toEqual([1, 2, 3]);
    });
  });
});