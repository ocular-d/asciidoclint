import { LintRule, LintMessage, LintContext } from '@testthedocs/core';

interface HeadingSpacingConfig {
  requireBefore?: boolean;
  requireAfter?: boolean;
  exceptions?: number[];
  allowConsecutiveHeadings?: boolean;
}

interface HeadingPosition {
  line: number;
  level: number;
  title: string;
}

// Cache for heading positions to improve performance
const headingCache = new WeakMap<any, HeadingPosition[]>();

export const headingSpacingRule: LintRule = {
  name: 'heading-spacing',
  description: 'Require blank lines around headings (except level 1)',
  severity: 'warning',
  
  check(document: any, context: LintContext): LintMessage[] {
    const messages: LintMessage[] = [];
    
    // Get source content from context or document
    const contextWithSource = context as LintContext & { sourceLines?: string[] };
    const source = contextWithSource.sourceLines || document.getSourceLines?.();
    if (!source || source.length === 0) {
      return messages;
    }

    // Get configuration with defaults
    const ruleConfig = context.options.rules?.['heading-spacing'];
    let config: HeadingSpacingConfig = {};
    
    if (typeof ruleConfig === 'object' && ruleConfig !== null && typeof ruleConfig !== 'string') {
      config = ruleConfig as HeadingSpacingConfig;
    }
    
    const {
      requireBefore = true,
      requireAfter = true,
      exceptions = [],
      allowConsecutiveHeadings = false
    } = config;

    // Get severity level
    const severity = typeof ruleConfig === 'string' ? ruleConfig : 
                    (ruleConfig && typeof ruleConfig === 'object' && ruleConfig.severity) || 
                    this.severity;

    if (severity === 'off') {
      return messages;
    }

    // Get or cache heading positions
    let headings = headingCache.get(document);
    if (!headings) {
      headings = extractHeadingPositions(document, source);
      headingCache.set(document, headings);
    }

    // Check each heading for spacing violations
    for (const heading of headings) {
      // Skip level 1 headings (document title)
      if (heading.level === 1) {
        continue;
      }

      // Skip if heading level is in exceptions
      if (exceptions.includes(heading.level)) {
        continue;
      }

      const lineIndex = heading.line - 1; // Convert to 0-indexed

      // Check for blank line before
      if (requireBefore) {
        const shouldCheckBefore = !allowConsecutiveHeadings || !isPrecededByHeading(headings, heading);
        
        if (shouldCheckBefore && !hasBlankLineBefore(source, lineIndex)) {
          messages.push({
            rule: 'heading-spacing',
            message: `Heading "${heading.title}" should have blank line before it`,
            severity: severity as any,
            line: heading.line,
            column: 1
          });
        }
      }

      // Check for blank line after
      if (requireAfter) {
        const shouldCheckAfter = !allowConsecutiveHeadings || !isFollowedByHeading(headings, heading);
        
        if (shouldCheckAfter && !hasBlankLineAfter(source, lineIndex)) {
          messages.push({
            rule: 'heading-spacing',
            message: `Heading "${heading.title}" should have blank line after it`,
            severity: severity as any,
            line: heading.line,
            column: 1
          });
        }
      }
    }

    return messages;
  }
};

function extractHeadingPositions(_document: any, source: string[]): HeadingPosition[] {
  const headings: HeadingPosition[] = [];

  // Parse headings directly from source lines using regex
  for (let i = 0; i < source.length; i++) {
    const line = source[i].trim();
    
    // Match AsciiDoc heading patterns: = Title, == Title, === Title, etc.
    const headingMatch = line.match(/^(=+)\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      
      headings.push({
        line: i + 1, // Convert to 1-indexed
        level: level,
        title: title
      });
    }
  }

  // Sort by line number for efficient processing
  return headings.sort((a, b) => a.line - b.line);
}

function isBlankLine(line: string): boolean {
  return line.trim() === '';
}

function hasBlankLineBefore(source: string[], lineIndex: number): boolean {
  if (lineIndex <= 0) {
    return true; // First line of document doesn't need blank line before
  }
  
  return isBlankLine(source[lineIndex - 1]);
}

function hasBlankLineAfter(source: string[], lineIndex: number): boolean {
  if (lineIndex >= source.length - 1) {
    return true; // Last line of document doesn't need blank line after
  }
  
  return isBlankLine(source[lineIndex + 1]);
}

function isPrecededByHeading(headings: HeadingPosition[], currentHeading: HeadingPosition): boolean {
  const currentIndex = headings.findIndex(h => h.line === currentHeading.line);
  if (currentIndex <= 0) {
    return false;
  }
  
  const previousHeading = headings[currentIndex - 1];
  // Check if the previous heading is immediately before (no content in between)
  return previousHeading.line === currentHeading.line - 1;
}

function isFollowedByHeading(headings: HeadingPosition[], currentHeading: HeadingPosition): boolean {
  const currentIndex = headings.findIndex(h => h.line === currentHeading.line);
  if (currentIndex < 0 || currentIndex >= headings.length - 1) {
    return false;
  }
  
  const nextHeading = headings[currentIndex + 1];
  // Check if the next heading is immediately after (no content in between)
  return nextHeading.line === currentHeading.line + 1;
}