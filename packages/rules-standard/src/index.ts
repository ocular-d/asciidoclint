import { AsciiDocLinter } from '@asciidoclint/core';
import { titleCaseRule } from './rules/title-case';
import { noTrailingSpacesRule } from './rules/no-trailing-spaces';
import { maxLineLengthRule } from './rules/max-line-length';

export function loadStandardRules(linter: AsciiDocLinter): void {
  linter.addRule(titleCaseRule);
  linter.addRule(noTrailingSpacesRule);
  linter.addRule(maxLineLengthRule);
}

export {
  titleCaseRule,
  noTrailingSpacesRule,
  maxLineLengthRule
};