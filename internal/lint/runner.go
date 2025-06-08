package lint

import (
	"bufio"
	"os"
	//"strings"

	"github.com/ocular-d/asciidoclint/rules"
)

func RunLinter(filePath string, allRules []rules.Rule) ([]rules.Result, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	var allResults []rules.Result
	for _, rule := range allRules {
		results := rule.Check(filePath, lines)
		allResults = append(allResults, results...)
	}

	return allResults, nil
}
