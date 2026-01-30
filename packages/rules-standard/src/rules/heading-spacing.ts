import { LintRule, LintMessage, LintContext } from '@testthedocs/core';

interface HeadingSpacingConfig {
  requireBefore?: boolean;
  requireAfter?: boolean;
  exceptions?: number[];
  allowConsecutiveHeadings?: boolean;
  ignoreAttributeBlocks?: boolean;
  ignoreComplexAttributes?: boolean;
  maxAttributeDepthScan?: number;
}

interface AttributeScanResult {
  isAttributeBlock: boolean;
  attributeLines: number;
  hasBlankLine: boolean;
  malformedLines: number[];
}

interface AttributeValidationResult {
  isAttribute: boolean;
  isValid: boolean;
  attributeType: 'simple' | 'complex' | 'named' | 'shortcut' | 'malformed';
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
    
    if (Array.isArray(ruleConfig) && ruleConfig.length > 1 && typeof ruleConfig[1] === 'object') {
      // Handle ["severity", { options }] format
      config = ruleConfig[1] as HeadingSpacingConfig;
    } else if (typeof ruleConfig === 'object' && ruleConfig !== null && typeof ruleConfig !== 'string' && !Array.isArray(ruleConfig)) {
      // Handle { options } format
      config = ruleConfig as HeadingSpacingConfig;
    }
    
    const {
      requireBefore = true,
      requireAfter = true,
      exceptions = [],
      allowConsecutiveHeadings = false,
      ignoreAttributeBlocks = false,
      ignoreComplexAttributes = false,
      maxAttributeDepthScan = 10
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
        
        if (shouldCheckBefore) {
          const beforeResult = hasBlankLineBeforeWithAttributes(source, lineIndex, {
            ignoreAttributeBlocks,
            ignoreComplexAttributes,
            maxAttributeDepthScan
          });
          
          if (!beforeResult.hasBlankLine) {
            messages.push({
              rule: 'heading-spacing',
              message: `Heading "${heading.title}" should have blank line before it`,
              severity: severity as any,
              line: heading.line,
              column: 1
            });
          }
          
          // Add warnings for malformed attributes
          if (beforeResult.scanResult?.malformedLines.length) {
            for (const malformedLine of beforeResult.scanResult.malformedLines) {
              messages.push({
                rule: 'heading-spacing',
                message: `Malformed attribute syntax on line ${malformedLine} before heading "${heading.title}"`,
                severity: 'warning' as any,
                line: malformedLine,
                column: 1
              });
            }
          }
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

// AsciiDoc attribute patterns for comprehensive detection
const ATTRIBUTE_PATTERNS = {
  // Simple ID: [#anchor-id]
  SIMPLE_ID: /^\[#[a-zA-Z][a-zA-Z0-9_-]*\]$/,
  
  // Simple role: [.role-name]
  SIMPLE_ROLE: /^\[\.[a-zA-Z][a-zA-Z0-9_-]*\]$/,
  
  // Complex combinations: [#id.role1.role2] or [.role1#id.role2]
  COMPLEX_MIXED: /^\[(?:#[a-zA-Z][a-zA-Z0-9_-]*)?(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*(?:#[a-zA-Z][a-zA-Z0-9_-]*)?(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*\]$/,
  
  // Block shortcuts: [source,javascript] [NOTE] [TIP]
  BLOCK_SHORTCUTS: /^\[(?:source|listing|literal|sidebar|example|quote|verse|pass|open|NOTE|TIP|WARNING|CAUTION|IMPORTANT|abstract|partintro)(?:,[^\]]*)?\]$/,
  
  // Named attributes: [key=value] or [key="quoted value"]
  NAMED_ATTRIBUTES: /^\[[a-zA-Z][a-zA-Z0-9_-]*=(?:"[^"]*"|'[^']*'|[^\s,\]]+)(?:\s*,\s*[^,\]]+)*\]$/,
  
  // Language shortcuts: [,javascript]
  LANGUAGE_SHORTCUTS: /^\[,[a-zA-Z][a-zA-Z0-9+_-]*\]$/,
  
  // General attribute bracket pattern (for basic validation)
  ATTRIBUTE_BRACKETS: /^\[[^\]]+\]$/
};

// Block delimiter patterns to detect code blocks and other contexts
const BLOCK_DELIMITERS = /^([-=*_+.]{4,})$/;

function isInsideCodeBlock(source: string[], lineIndex: number, scanDepth: number = 5): boolean {
  let openDelimiter: string | null = null;
  
  // Look backward for opening delimiter
  for (let i = Math.max(0, lineIndex - scanDepth); i < lineIndex; i++) {
    const line = source[i].trim();
    const delimiterMatch = line.match(BLOCK_DELIMITERS);
    
    if (delimiterMatch) {
      const delimiter = delimiterMatch[1];
      if (!openDelimiter) {
        openDelimiter = delimiter;
      } else if (delimiter === openDelimiter) {
        openDelimiter = null; // Closed block
      }
    }
  }
  
  return openDelimiter !== null;
}

function isAttributeLine(line: string, enableComplexAttributes: boolean): AttributeValidationResult {
  const trimmed = line.trim();
  
  // Must be bracket-enclosed
  if (!ATTRIBUTE_PATTERNS.ATTRIBUTE_BRACKETS.test(trimmed)) {
    return { isAttribute: false, isValid: true, attributeType: 'simple' };
  }
  
  // Test against specific patterns
  if (ATTRIBUTE_PATTERNS.SIMPLE_ID.test(trimmed) || ATTRIBUTE_PATTERNS.SIMPLE_ROLE.test(trimmed)) {
    return { isAttribute: true, isValid: true, attributeType: 'simple' };
  }
  
  if (ATTRIBUTE_PATTERNS.BLOCK_SHORTCUTS.test(trimmed)) {
    return { isAttribute: true, isValid: true, attributeType: 'shortcut' };
  }
  
  if (ATTRIBUTE_PATTERNS.LANGUAGE_SHORTCUTS.test(trimmed)) {
    return { isAttribute: true, isValid: true, attributeType: 'shortcut' };
  }
  
  if (ATTRIBUTE_PATTERNS.NAMED_ATTRIBUTES.test(trimmed)) {
    return { isAttribute: true, isValid: true, attributeType: 'named' };
  }
  
  if (enableComplexAttributes && ATTRIBUTE_PATTERNS.COMPLEX_MIXED.test(trimmed)) {
    return { isAttribute: true, isValid: true, attributeType: 'complex' };
  }
  
  // If it looks like an attribute but doesn't match patterns, it's malformed
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return { isAttribute: true, isValid: false, attributeType: 'malformed' };
  }
  
  return { isAttribute: false, isValid: true, attributeType: 'simple' };
}

function scanBackwardForAttributes(
  source: string[], 
  headingLineIndex: number, 
  config: HeadingSpacingConfig
): AttributeScanResult {
  const maxScan = config.maxAttributeDepthScan || 10;
  const enableComplex = config.ignoreComplexAttributes || false;
  
  let currentIndex = headingLineIndex - 1;
  let attributeLines = 0;
  let malformedLines: number[] = [];
  let foundNonAttribute = false;
  let hasBlankLine = false;
  
  // Scan backward from heading
  while (currentIndex >= 0 && attributeLines < maxScan && !foundNonAttribute) {
    const line = source[currentIndex].trim();
    
    // Check for blank line
    if (line === '') {
      hasBlankLine = true;
      break;
    }
    
    // Skip if inside code block
    if (isInsideCodeBlock(source, currentIndex)) {
      foundNonAttribute = true;
      break;
    }
    
    // Check if line is an attribute
    const attributeResult = isAttributeLine(line, enableComplex);
    
    if (attributeResult.isAttribute) {
      attributeLines++;
      if (!attributeResult.isValid) {
        malformedLines.push(currentIndex + 1); // Convert to 1-based
      }
    } else {
      foundNonAttribute = true;
      break;
    }
    
    currentIndex--;
  }
  
  return {
    isAttributeBlock: attributeLines > 0,
    attributeLines,
    hasBlankLine,
    malformedLines
  };
}

function hasBlankLineBeforeWithAttributes(
  source: string[], 
  lineIndex: number, 
  config: HeadingSpacingConfig
): { hasBlankLine: boolean; scanResult?: AttributeScanResult } {
  if (lineIndex <= 0) {
    return { hasBlankLine: true }; // First line of document
  }
  
  // If attribute handling is disabled, use original logic
  if (!config.ignoreAttributeBlocks && !config.ignoreComplexAttributes) {
    return { hasBlankLine: isBlankLine(source[lineIndex - 1]) };
  }
  
  // Scan backward for attributes
  const scanResult = scanBackwardForAttributes(source, lineIndex, config);
  
  if (!scanResult.isAttributeBlock) {
    // No attributes found, check immediately preceding line
    return { 
      hasBlankLine: isBlankLine(source[lineIndex - 1]),
      scanResult 
    };
  }
  
  // Found attribute block - check what comes before it
  if (scanResult.hasBlankLine) {
    return { hasBlankLine: true, scanResult };
  }
  
  // Check line before attribute block starts
  const attributeBlockStart = lineIndex - scanResult.attributeLines;
  if (attributeBlockStart > 0) {
    return { 
      hasBlankLine: isBlankLine(source[attributeBlockStart - 1]),
      scanResult 
    };
  }
  
  // Attribute block starts at document beginning
  return { hasBlankLine: true, scanResult };
}