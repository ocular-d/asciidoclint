package rules

import (
	"fmt"
	"regexp"
	"strings"
)

type AD002DiscouragedSourceLangRule struct{}

func (r AD002DiscouragedSourceLangRule) Name() string {
	return "AD002"
}

var (
	sourcePattern     = regexp.MustCompile(`^\[source\s*,\s*(.+?)\s*\]`)
	disablePattern002 = regexp.MustCompile(`^\s*//\s*adoc-lint\s+disable\s+AD002\b`)
	enablePattern002  = regexp.MustCompile(`^\s*//\s*adoc-lint\s+enable\s+AD002\b`)
)

// Disallowed source languages
var disallowedLanguages = map[string]bool{
	"console":      true,
	"shell script": true,
}

func (r AD002DiscouragedSourceLangRule) Check(file string, lines []string) []Result {
	var results []Result
	ruleEnabled := true

	for i, rawLine := range lines {
		line := strings.TrimSpace(rawLine)

		switch {
		case disablePattern002.MatchString(line):
			ruleEnabled = false
			continue
		case enablePattern002.MatchString(line):
			ruleEnabled = true
			continue
		case !ruleEnabled:
			continue
		}

		match := sourcePattern.FindStringSubmatch(line)
		if match == nil {
			continue
		}

		lang := strings.ToLower(strings.TrimSpace(match[1]))
		if disallowedLanguages[lang] {
			results = append(results, Result{
				File:     file,
				Line:     i + 1,
				RuleName: r.Name(),
				Message:  fmt.Sprintf("Disallowed source block language: '%s'", lang),
			})
		}
	}

	return results
}
