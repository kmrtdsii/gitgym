package commands

import (
	"context"
	"fmt"
	"os"

	"github.com/kmrtdsii/playwithantigravity/backend/pkg/git"
)

func init() {
	git.RegisterCommand("touch", func() git.Command { return &TouchCommand{} })
}

type TouchCommand struct{}

func (c *TouchCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	if len(args) < 2 {
		return "", fmt.Errorf("usage: touch <filename>")
	}

	filename := args[1]

	s.Lock()
	defer s.Unlock()

	// Check if file exists
	_, err := s.Filesystem.Stat(filename)
	if err != nil {
		// File likely doesn't exist, create it (empty)
		f, err := s.Filesystem.Create(filename)
		if err != nil {
			return "", err
		}
		f.Close()
		return fmt.Sprintf("Created '%s'", filename), nil
	}

	// File exists, append to it
	f, err := s.Filesystem.OpenFile(filename, os.O_APPEND|os.O_RDWR, 0644)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := f.Write([]byte("\n// Update")); err != nil {
		return "", err
	}

	return fmt.Sprintf("Updated '%s'", filename), nil
}

func (c *TouchCommand) Help() string {
	return "usage: touch <filename>\n\nUpdate modifications timestamp of a file or create it."
}
