# AsciiDoc Linter Rule Development Style Guide

This guide outlines the structure, naming, and implementation conventions for writing rules for the AsciiDoc linter.

---

## 1. Rule Structure

Each rule must:

* Implement the `Rule` interface.
* Be placed in its own Go file inside the `rules/` directory.
* Use the filename format: `adXYZ_<short_description>.go`.
* Be registered in `main.go`.

### Rule Interface

```go
type Rule interface {
    Name() string
    Check(file string, lines []string) []Result
}
```

---

## 2. File Naming

Use the following convention:

```
rules/adXYZ_<short_description>.go
```

### Examples:

* `ad001_heading_format.go`
* `ad002_disallowed_source_blocks.go`

---

## 3. Struct Definition

Each rule must define a struct named after its ID:

```go
type AD001HeadingFormatRule struct{}
```

---

## 4. Name Method

```go
func (r AD001HeadingFormatRule) Name() string {
    return "AD001"
}
```

---

## 5. Check Method

Implements the rule's logic:

```go
func (r AD001HeadingFormatRule) Check(file string, lines []string) []Result
```

The method returns a slice of `Result` for each issue found.

---

## 6. Result Struct

```go
type Result struct {
    File     string
    Line     int
    RuleName string
    Message  string
}
```

### Example:

```go
results = append(results, Result{
    File:     file,
    Line:     i + 1,
    RuleName: r.Name(),
    Message:  "Heading should start with uppercase letter",
})
```

---

## 7. Rule Disable / Enable

All rules must support being toggled in `.adoc` files using:

```adoc
//adoc-lint disable AD001
//adoc-lint enable AD001
```

### Implementation Example

```go
disablePattern := regexp.MustCompile(`^\s*//\s*adoc-lint\s+disable\s+AD001\b`)
enablePattern := regexp.MustCompile(`^\s*//\s*adoc-lint\s+enable\s+AD001\b`)
```

Use a `ruleEnabled` flag to skip checks when disabled.

---

## 8. Tests (Recommended)

* Place in a file like `ad001_heading_format_test.go`
* Use Go's `testing` package
* Use `t.Run()` for subcases

---

## 9. Rule Registration

Register all rules in `main.go`:

```go
allRules := []rules.Rule{
    rules.AD001HeadingFormatRule{},
    rules.AD002DiscouragedSourceLangRule{},
    // New rules go here
}
```

---

## 10. Message Conventions

* Start with uppercase
* No periods at the end
* Be descriptive but concise

### Example

```go
Message: "Multiple top-level headings found"
```

---

## 11. Optional Metadata (for future use)

Rules may implement optional metadata:

```go
func (r AD001HeadingFormatRule) Description() string {
    return "Checks heading format for spacing and capitalization"
}
```

This can support features like `--list-rules` in the CLI.

---

## 12. Skeleton Template

```go
package rules

import (
    "fmt"
    "regexp"
    "strings"
)

type ADXYZExampleRule struct{}

func (r ADXYZExampleRule) Name() string {
    return "ADXYZ"
}

var (
    patternXYZ         = regexp.MustCompile(`your-pattern-here`)
    disablePatternXYZ  = regexp.MustCompile(`^\s*//\s*adoc-lint\s+disable\s+ADXYZ\b`)
    enablePatternXYZ   = regexp.MustCompile(`^\s*//\s*adoc-lint\s+enable\s+ADXYZ\b`)
)

func (r ADXYZExampleRule) Check(file string, lines []string) []Result {
    var results []Result
    ruleEnabled := true

    for i, rawLine := range lines {
        line := strings.TrimSpace(rawLine)

        switch {
        case disablePatternXYZ.MatchString(line):
            ruleEnabled = false
            continue
        case enablePatternXYZ.MatchString(line):
            ruleEnabled = true
            continue
        case !ruleEnabled:
            continue
        }

        // Rule logic goes here
    }

    return results
}
```

---

This style guide ensures that all linter rules are easy to read, consistent, and scalable.
