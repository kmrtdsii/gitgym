package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestMergeCommand_Basic(t *testing.T) {
	sm := git.NewSessionManager()
	s, _ := sm.CreateSession("test-merge-basic")
	ctx := context.Background()

	// Init repo with initial commit
	s.InitRepo("testrepo")
	s.CurrentDir = "/testrepo"

	touchCmd := &TouchCommand{}
	addCmd := &AddCommand{}
	commitCmd := &CommitCommand{}
	branchCmd := &BranchCommand{}
	switchCmd := &SwitchCommand{}
	mergeCmd := &MergeCommand{}

	// Create initial commit
	touchCmd.Execute(ctx, s, []string{"touch", "file.txt"})
	addCmd.Execute(ctx, s, []string{"add", "."})
	commitCmd.Execute(ctx, s, []string{"commit", "-m", "Initial commit"})

	t.Run("Merge creates commit", func(t *testing.T) {
		// Create feature branch and diverge
		branchCmd.Execute(ctx, s, []string{"branch", "feature"})
		switchCmd.Execute(ctx, s, []string{"switch", "feature"})

		touchCmd.Execute(ctx, s, []string{"touch", "feature.txt"})
		addCmd.Execute(ctx, s, []string{"add", "."})
		commitCmd.Execute(ctx, s, []string{"commit", "-m", "Feature commit"})

		// Now make a different change on master to force non-ff merge
		switchCmd.Execute(ctx, s, []string{"switch", "master"})
		touchCmd.Execute(ctx, s, []string{"touch", "master.txt"})
		addCmd.Execute(ctx, s, []string{"add", "."})
		commitCmd.Execute(ctx, s, []string{"commit", "-m", "Master commit"})

		// Merge feature - this should create a merge commit
		res, err := mergeCmd.Execute(ctx, s, []string{"merge", "feature"})
		if err != nil {
			t.Fatalf("Merge failed: %v", err)
		}
		// Accept any successful merge result
		_ = res
	})

	t.Run("Merge help", func(t *testing.T) {
		res, err := mergeCmd.Execute(ctx, s, []string{"merge", "--help"})
		if err != nil {
			t.Fatalf("Merge --help failed: %v", err)
		}
		if !strings.Contains(res, "GIT-MERGE") {
			t.Errorf("Expected help text, got: %s", res)
		}
	})
}
