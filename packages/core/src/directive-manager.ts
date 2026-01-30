import Debug from 'debug';
import { LintMessage } from './types/index';

const debug = Debug('asciidoclint:directive-manager');

export interface DirectiveState {
  disabledRules: Set<string>;
  disableAll: boolean;
}

export interface ParsedDirective {
  type: 'disable' | 'enable' | 'disable-all' | 'enable-all';
  rules: string[];
  line: number;
  isValid: boolean;
  error?: string;
}

export class DirectiveManager {
  private static readonly DIRECTIVE_REGEX = /^\/\/\s*adoc-lint\s+(disable|enable|disable-all|enable-all)(?:\s+(.+))?$/;
  private static readonly cache = new Map<string, { hash: string; directives: ParsedDirective[] }>();

  private directives: ParsedDirective[] = [];
  private lineStates: Map<number, DirectiveState> = new Map();
  private validRules: Set<string>;

  constructor(validRules: string[]) {
    this.validRules = new Set(validRules);
    debug('DirectiveManager initialized with valid rules: %O', validRules);
  }

  /**
   * Parse directives from source lines with caching based on content hash
   */
  parseDirectives(lines: string[], contentHash?: string): LintMessage[] {
    // Check cache if hash provided
    if (contentHash) {
      const cached = DirectiveManager.cache.get(contentHash);
      if (cached) {
        debug('Using cached directives for hash: %s', contentHash);
        this.directives = cached.directives;
        this.buildLineStates();
        return this.generateDirectiveWarnings();
      }
    }

    // Parse directives from source
    this.directives = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const match = DirectiveManager.DIRECTIVE_REGEX.exec(line.trim());

      if (match) {
        const [, command, rulesStr] = match;
        const directive = this.parseDirective(command, rulesStr, lineNumber);
        this.directives.push(directive);
        debug('Parsed directive on line %d: %O', lineNumber, directive);
      }
    }

    // Cache results if hash provided
    if (contentHash) {
      DirectiveManager.cache.set(contentHash, {
        hash: contentHash,
        directives: [...this.directives]
      });
      debug('Cached directives for hash: %s', contentHash);
    }

    this.buildLineStates();
    return this.generateDirectiveWarnings();
  }

  /**
   * Parse individual directive command
   */
  private parseDirective(command: string, rulesStr: string | undefined, line: number): ParsedDirective {
    const directive: ParsedDirective = {
      type: command as 'disable' | 'enable' | 'disable-all' | 'enable-all',
      rules: [],
      line,
      isValid: true
    };

    // Commands that don't take rule arguments
    if (command === 'disable-all' || command === 'enable-all') {
      if (rulesStr && rulesStr.trim()) {
        directive.isValid = false;
        directive.error = `Command '${command}' does not accept rule arguments`;
      }
      return directive;
    }

    // Commands that require rule arguments
    if (!rulesStr || !rulesStr.trim()) {
      directive.isValid = false;
      directive.error = `Command '${command}' requires rule names`;
      return directive;
    }

    // Parse rule list
    const rules = rulesStr.split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (rules.length === 0) {
      directive.isValid = false;
      directive.error = `Command '${command}' requires valid rule names`;
      return directive;
    }

    // Validate rule names
    const invalidRules = rules.filter(rule => !this.validRules.has(rule));
    if (invalidRules.length > 0) {
      directive.isValid = false;
      directive.error = `Unknown rules: ${invalidRules.join(', ')}. Valid rules: ${Array.from(this.validRules).join(', ')}`;
      return directive;
    }

    directive.rules = rules;
    return directive;
  }

  /**
   * Build line-by-line rule states based on directives
   */
  private buildLineStates(): void {
    this.lineStates.clear();
    
    let currentState: DirectiveState = {
      disabledRules: new Set(),
      disableAll: false
    };

    // Sort directives by line number
    const sortedDirectives = [...this.directives]
      .filter(d => d.isValid)
      .sort((a, b) => a.line - b.line);

    let directiveIndex = 0;
    let maxLine = 0;

    // Find maximum line number from directives
    if (sortedDirectives.length > 0) {
      maxLine = Math.max(...sortedDirectives.map(d => d.line));
    }

    // Build states for each line
    for (let lineNumber = 1; lineNumber <= maxLine + 1000; lineNumber++) { // Add buffer for content after directives
      // Apply any directives that take effect on this line
      while (directiveIndex < sortedDirectives.length && 
             sortedDirectives[directiveIndex].line <= lineNumber) {
        const directive = sortedDirectives[directiveIndex];
        currentState = this.applyDirective(currentState, directive);
        directiveIndex++;
      }

      // Store state for this line
      this.lineStates.set(lineNumber, {
        disabledRules: new Set(currentState.disabledRules),
        disableAll: currentState.disableAll
      });
    }

    debug('Built line states for %d lines', this.lineStates.size);
  }

  /**
   * Apply directive to current state with priority handling
   */
  private applyDirective(currentState: DirectiveState, directive: ParsedDirective): DirectiveState {
    const newState: DirectiveState = {
      disabledRules: new Set(currentState.disabledRules),
      disableAll: currentState.disableAll
    };

    switch (directive.type) {
      case 'disable-all':
        newState.disableAll = true;
        // Clear specific rule disables as disable-all takes precedence
        newState.disabledRules.clear();
        break;

      case 'enable-all':
        newState.disableAll = false;
        newState.disabledRules.clear();
        break;

      case 'disable':
        // Specific rule disable overrides disable-all
        newState.disableAll = false;
        directive.rules.forEach(rule => newState.disabledRules.add(rule));
        break;

      case 'enable':
        // Specific rule enable overrides disable-all
        newState.disableAll = false;
        directive.rules.forEach(rule => newState.disabledRules.delete(rule));
        break;
    }

    debug('Applied directive %s on line %d: %O -> %O', 
          directive.type, directive.line, currentState, newState);
    return newState;
  }

  /**
   * Generate warning messages for invalid directives
   */
  private generateDirectiveWarnings(): LintMessage[] {
    return this.directives
      .filter(d => !d.isValid)
      .map(d => ({
        rule: 'directive-syntax',
        message: `Invalid directive syntax: ${d.error}`,
        severity: 'warning' as const,
        line: d.line,
        column: 1
      }));
  }

  /**
   * Check if a rule is disabled for a specific line
   */
  isRuleDisabled(ruleName: string, lineNumber: number): boolean {
    const state = this.lineStates.get(lineNumber);
    if (!state) {
      return false;
    }

    // disable-all takes precedence unless specific rule is enabled
    if (state.disableAll) {
      return true;
    }

    // Check specific rule disables
    return state.disabledRules.has(ruleName);
  }

  /**
   * Check if a line is a directive line (should be excluded from rule checking)
   */
  isDirectiveLine(lineNumber: number): boolean {
    return this.directives.some(d => d.line === lineNumber);
  }

  /**
   * Get all directive lines for debugging
   */
  getDirectiveLines(): number[] {
    return this.directives.map(d => d.line);
  }

  /**
   * Clear cache - useful for testing or when rules change
   */
  static clearCache(): void {
    DirectiveManager.cache.clear();
    debug('Directive cache cleared');
  }

  /**
   * Generate content hash for caching
   */
  static generateContentHash(content: string): string {
    // Simple hash function - in production might use crypto.createHash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}