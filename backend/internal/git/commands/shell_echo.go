package commands

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("echo", func() git.Command { return &EchoCommand{} })
}

type EchoCommand struct{}

// Ensure EchoCommand implements git.Command
var _ git.Command = (*EchoCommand)(nil)

func (c *EchoCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	s.Lock()
	defer s.Unlock()

	// args[0] is "echo"
	if len(args) <= 1 {
		return "", nil
	}

	contentArgs := args[1:]

	// Handle redirection manually since our shell is fake
	// Look for > or >>
	var redirectOp string
	var targetFile string
	var contentParts []string

	for i, arg := range contentArgs {
		if arg == ">" || arg == ">>" {
			redirectOp = arg
			if i+1 < len(contentArgs) {
				targetFile = contentArgs[i+1]
			}
			break
		}
		// Handle attached redirection like "foo>bar" (parser might split or not?)
		// Our parser splits by space. "foo>bar" might be one arg?
		// For simplicity, assume parser handled spacing or use simple arguments.
		// The user instruction is `echo '4829' > answer.txt`. This has spaces.
		contentParts = append(contentParts, arg)
	}

	output := strings.Join(contentParts, " ")

	// Remove quotes if present (simplistic)
	if len(output) >= 2 && output[0] == '\'' && output[len(output)-1] == '\'' {
		output = output[1 : len(output)-1]
	} else if len(output) >= 2 && output[0] == '"' && output[len(output)-1] == '"' {
		output = output[1 : len(output)-1]
	}

	if redirectOp == "" {
		return output, nil
	}

	if targetFile == "" {
		return "", fmt.Errorf("syntax error: expected file after redirection")
	}

	// Resolve target path
	fullPath := targetFile
	if !strings.HasPrefix(fullPath, "/") {
		if s.CurrentDir == "/" {
			fullPath = "/" + fullPath
		} else {
			fullPath = s.CurrentDir + "/" + fullPath
		}
	}

	flag := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	if redirectOp == ">>" {
		flag = os.O_WRONLY | os.O_CREATE | os.O_APPEND
	}

	f, err := s.Filesystem.OpenFile(fullPath, flag, 0644)
	if err != nil {
		return "", fmt.Errorf("failed to open file '%s': %w", targetFile, err)
	}
	defer f.Close()

	if _, err := f.Write([]byte(output + "\n")); err != nil {
		return "", fmt.Errorf("failed to write to file: %w", err)
	}

	return "", nil
}

func (c *EchoCommand) Help() string {
	return "usage: echo <text> [> file]"
}
