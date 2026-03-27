import { AsciiDocLinter } from '@testthedocs/core';
import { titleCaseRule } from './rules/title-case.js';
import { noTrailingSpacesRule } from './rules/no-trailing-spaces.js';
import { maxLineLengthRule } from './rules/max-line-length.js';
import { headingSpacingRule } from './rules/heading-spacing.js';

export function loadStandardRules(linter: AsciiDocLinter): void {
  linter.addRule(headingSpacingRule);  // Add first for optimal execution order
  linter.addRule(titleCaseRule);
  linter.addRule(noTrailingSpacesRule);
  linter.addRule(maxLineLengthRule);
}

export {
  titleCaseRule,
  noTrailingSpacesRule,
  maxLineLengthRule,
  headingSpacingRule
};