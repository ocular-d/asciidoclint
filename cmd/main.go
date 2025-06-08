package main

import (
	"fmt"
	"os"

	"github.com/ocular-d/asciidoclint/internal/lint"
	"github.com/ocular-d/asciidoclint/rules"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: adoc-linter <file.adoc>")
		os.Exit(1)
	}
	fileName := os.Args[1]

	allRules := []rules.Rule{
		rules.AD001HeadingFormatRule{},
		rules.AD002DiscouragedSourceLangRule{},
	}

	results, err := lint.RunLinter(fileName, allRules)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		os.Exit(1)
	}

	if len(results) > 0 {
		for _, res := range results {
			fmt.Printf("❌ %s:%d [%s] %s\n", res.File, res.Line, res.RuleName, res.Message)
		}
		os.Exit(1)
	} else {
		fmt.Printf("✅ %s passed all rules!\n", fileName)
	}
}

