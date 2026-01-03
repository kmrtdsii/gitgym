package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestReflogCommand_Basic(t *testing.T) {
	sm := git.NewSessionManager()
	s, _ := sm.CreateSession("test-reflog")
	ctx := context.Background()

	// Init repo
	s.InitRepo("testrepo")
	s.CurrentDir = "/testrepo"

	touchCmd := &TouchCommand{}
	addCmd := &AddCommand{}
	commitCmd := &CommitCommand{}
	reflogCmd := &ReflogCommand{}

	// Create initial commit
	touchCmd.Execute(ctx, s, []string{"touch", "file.txt"})
	addCmd.Execute(ctx, s, []string{"add", "."})
	commitCmd.Execute(ctx, s, []string{"commit", "-m", "Initial commit"})

	// Create another commit
	touchCmd.Execute(ctx, s, []string{"touch", "file2.txt"})
	addCmd.Execute(ctx, s, []string{"add", "."})
	commitCmd.Execute(ctx, s, []string{"commit", "-m", "Second commit"})

	t.Run("Reflog basic", func(t *testing.T) {
		res, err := reflogCmd.Execute(ctx, s, []string{"reflog"})
		if err != nil {
			t.Fatalf("Reflog failed: %v", err)
		}
		// Should contain commit entries
		if !strings.Contains(res, "HEAD@{") || !strings.Contains(res, "commit") {
			t.Errorf("Expected reflog entries, got: %s", res)
		}
	})

	t.Run("Reflog help", func(t *testing.T) {
		res, err := reflogCmd.Execute(ctx, s, []string{"reflog", "--help"})
		if err != nil {
			t.Fatalf("Reflog --help failed: %v", err)
		}
		if !strings.Contains(res, "GIT-REFLOG") {
			t.Errorf("Expected help text, got: %s", res)
		}
	})
}
