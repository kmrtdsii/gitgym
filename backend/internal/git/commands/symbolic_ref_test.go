package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

// helper to create a session with an initialized repo and one commit
func setupSymbolicRefTestSession(t *testing.T, sm *git.SessionManager, id string) *git.Session {
	s, _ := sm.CreateSession(id)
	ctx := context.Background()

	// Init repo manually
	_, err := s.InitRepo("testrepo")
	if err != nil {
		t.Fatalf("setup: init failed: %v", err)
	}
	s.CurrentDir = "/testrepo"

	// Create a file and commit
	touchCmd := &TouchCommand{}
	_, err = touchCmd.Execute(ctx, s, []string{"touch", "file.txt"})
	if err != nil {
		t.Fatalf("setup: touch failed: %v", err)
	}

	addCmd := &AddCommand{}
	_, err = addCmd.Execute(ctx, s, []string{"add", "."})
	if err != nil {
		t.Fatalf("setup: add failed: %v", err)
	}

	commitCmd := &CommitCommand{}
	_, err = commitCmd.Execute(ctx, s, []string{"commit", "-m", "Initial commit"})
	if err != nil {
		t.Fatalf("setup: commit failed: %v", err)
	}

	return s
}

func TestSymbolicRefCommand(t *testing.T) {
	sm := git.NewSessionManager()
	s := setupSymbolicRefTestSession(t, sm, "test-symbolic-ref")
	ctx := context.Background()
	cmd := &SymbolicRefCommand{}

	t.Run("Read HEAD", func(t *testing.T) {
		result, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "HEAD"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !strings.Contains(result, "refs/heads/") {
			t.Errorf("expected refs/heads/, got: %s", result)
		}
	})

	t.Run("Read HEAD --short", func(t *testing.T) {
		result, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "--short", "HEAD"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		// Should be "master" or "main" without "refs/heads/"
		if strings.Contains(result, "refs/") {
			t.Errorf("expected short name, got: %s", result)
		}
	})

	t.Run("Write symbolic-ref", func(t *testing.T) {
		// Create a new branch first
		branchCmd := &BranchCommand{}
		_, err := branchCmd.Execute(ctx, s, []string{"branch", "feature"})
		if err != nil {
			t.Fatalf("failed to create branch: %v", err)
		}

		// Set HEAD to point to feature branch
		_, err = cmd.Execute(ctx, s, []string{"symbolic-ref", "HEAD", "refs/heads/feature"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Verify HEAD now points to feature
		result, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "HEAD"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != "refs/heads/feature" {
			t.Errorf("expected refs/heads/feature, got: %s", result)
		}
	})

	t.Run("Error on non-symbolic ref", func(t *testing.T) {
		// Direct hash reference should fail
		_, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "refs/heads/feature"})
		if err == nil {
			t.Error("expected error for non-symbolic ref, got nil")
		}
	})

	t.Run("Help", func(t *testing.T) {
		result, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "--help"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !strings.Contains(result, "GIT-SYMBOLIC-REF") {
			t.Errorf("expected help text, got: %s", result)
		}
	})

	t.Run("Write without refs prefix", func(t *testing.T) {
		// Set HEAD using short name (should auto-prefix with refs/heads/)
		_, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "HEAD", "master"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		result, err := cmd.Execute(ctx, s, []string{"symbolic-ref", "HEAD"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result != "refs/heads/master" {
			t.Errorf("expected refs/heads/master, got: %s", result)
		}
	})
}
