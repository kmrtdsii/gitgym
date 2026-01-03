package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestHelpCommand(t *testing.T) {
	sm := git.NewSessionManager()
	s, _ := sm.CreateSession("test-help")

	cmd := &HelpCommand{}
	ctx := context.Background()

	t.Run("Help basic", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"help"})
		if err != nil {
			t.Fatalf("Help failed: %v", err)
		}
		if !strings.Contains(res, "Git commands") && !strings.Contains(res, "git") {
			t.Errorf("Expected help list, got: %s", res)
		}
	})

	t.Run("Help specific command", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"help", "add"})
		if err != nil {
			t.Fatalf("Help add failed: %v", err)
		}
		if !strings.Contains(res, "add") {
			t.Errorf("Expected add help, got: %s", res)
		}
	})
}
