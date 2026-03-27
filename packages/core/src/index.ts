import asciidoctor from '@asciidoctor/core';
import Debug from 'debug';
import { LintRule, LintContext, LintResult, LintMessage, LintConfig } from './types/index.js';
import { DirectiveManager } from './directive-manager.js';

const debug = Debug('asciidoclint:core');

export class AsciiDocLinter {
  private rules: Map<string, LintRule> = new Map();
  private ruleExecutionOrder: string[] = [];
  private config: LintConfig;
  private asciidoc = asciidoctor();

  constructor(config: LintConfig = { rules: {} }) {
    // Set default for enableInlineDirectives if not specified
    const configWithDefaults = config as LintConfig & { enableInlineDirectives?: boolean };
    if (configWithDefaults.enableInlineDirectives === undefined) {
      configWithDefaults.enableInlineDirectives = true;
    }
    this.config = configWithDefaults;
    this.validateConfiguration();
    debug('Linter initialized with config: %O', config);
  }

  addRule(rule: LintRule): void {
    this.rules.set(rule.name, rule);
    this.updateRuleExecutionOrder(rule.name);
    debug('Added rule: %s', rule.name);
  }

  removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
    this.ruleExecutionOrder = this.ruleExecutionOrder.filter(name => name !== ruleName);
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

    const context: LintContext & { directiveManager?: DirectiveManager; sourceLines?: string[] } = {
      filename,
      options: this.config,
      directiveManager,
      sourceLines: content.split('\n')
    };

    // Execute rules in the defined order for optimal performance
    for (const ruleName of this.ruleExecutionOrder) {
      const rule = this.rules.get(ruleName);
      if (!rule) continue;
      
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

  private validateConfiguration(): void {
    const rules = this.config.rules || {};
    const warnings: string[] = [];

    // Check for conflicting rule configurations
    if (rules['heading-spacing'] && rules['max-line-length']) {
      const headingSpacing = rules['heading-spacing'];
      const maxLineLength = rules['max-line-length'];
      
      if (headingSpacing !== 'off' && maxLineLength !== 'off') {
        debug('Note: heading-spacing and max-line-length rules are both enabled. ' +
              'heading-spacing will be executed first for optimal performance.');
      }
    }

    // Validate rule configurations
    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      if (typeof ruleConfig === 'object' && ruleConfig !== null) {
        // Validate specific rule configurations
        if (ruleName === 'heading-spacing') {
          const config = ruleConfig as any;
          if (config.exceptions && !Array.isArray(config.exceptions)) {
            warnings.push(`Invalid 'exceptions' configuration for heading-spacing rule: must be an array`);
          }
          if (config.exceptions && config.exceptions.some((level: any) => typeof level !== 'number' || level < 1)) {
            warnings.push(`Invalid 'exceptions' configuration for heading-spacing rule: must contain positive integers`);
          }
        }
      }
    }

    if (warnings.length > 0) {
      debug('Configuration warnings: %O', warnings);
    }
  }

  private updateRuleExecutionOrder(ruleName: string): void {
    // Remove if already exists
    this.ruleExecutionOrder = this.ruleExecutionOrder.filter(name => name !== ruleName);
    
    // Define rule execution priority for optimal performance
    const priorityOrder = [
      'heading-spacing',  // Execute first as it may add blank lines that affect other rules
      'max-line-length',  // Execute after heading-spacing to handle any added content
      'no-trailing-spaces',
      'title-case'
    ];
    
    // Find the correct position to insert the rule
    const ruleIndex = priorityOrder.indexOf(ruleName);
    if (ruleIndex !== -1) {
      // Insert in priority position
      let insertIndex = 0;
      for (let i = 0; i < ruleIndex; i++) {
        const priorityRule = priorityOrder[i];
        const existingIndex = this.ruleExecutionOrder.indexOf(priorityRule);
        if (existingIndex !== -1) {
          insertIndex = existingIndex + 1;
        }
      }
      this.ruleExecutionOrder.splice(insertIndex, 0, ruleName);
    } else {
      // Unknown rule, add at the end
      this.ruleExecutionOrder.push(ruleName);
    }
    
    debug('Updated rule execution order: %O', this.ruleExecutionOrder);
  }
}

export * from './types/index.js';
export { DirectiveManager } from './directive-manager.js';
export { AsciiDocLinter as default };