package rules

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// Result holds the result of a linting check.
type Result struct {
	File     string
	Line     int
	RuleName string
	Message  string
}

// Rule defines the interface all rules must implement.
type Rule interface {
	Name() string
	Check(file string, lines []string) []Result
}

// AD001HeadingFormatRule checks for proper heading format.
type AD001HeadingFormatRule struct{}

// Name returns the rule name.
func (r AD001HeadingFormatRule) Name() string {
	return "AD001"
}

// Global heading pattern (note: space is optional here!)
var headingPattern = regexp.MustCompile(`^(=+)(\s*)(.*)$`)

// Check applies the heading format rule to each line.
func (r AD001HeadingFormatRule) Check(file string, lines []string) []Result {
	var results []Result
	ruleEnabled := true

	disablePattern := regexp.MustCompile(`^\s*//\s*adoc-lint\s+disable\s+AD001\b`)
	enablePattern := regexp.MustCompile(`^\s*//\s*adoc-lint\s+enable\s+AD001\b`)

	for i, rawLine := range lines {
		line := strings.TrimSpace(rawLine)

		// Handle enable/disable directives
		switch {
		case disablePattern.MatchString(line):
			ruleEnabled = false
			continue
		case enablePattern.MatchString(line):
			ruleEnabled = true
			continue
		case !ruleEnabled:
			continue
		}

		// Match heading line
		matches := headingPattern.FindStringSubmatch(rawLine)
		if matches == nil {
			continue
		}

		equals, space, text := matches[1], matches[2], matches[3]
		level := len(equals)

		// Missing space after '='
		if space == "" {
			results = append(results, Result{
				File:     file,
				Line:     i + 1,
				RuleName: r.Name(),
				Message:  fmt.Sprintf("Missing space after %s", strings.Repeat("=", level)),
			})
		}

		// Heading should start with uppercase
		if len(text) > 0 && unicode.IsLower(rune(text[0])) {
			results = append(results, Result{
				File:     file,
				Line:     i + 1,
				RuleName: r.Name(),
				Message:  "Heading should start with uppercase letter",
			})
		}
	}

	return results
}
