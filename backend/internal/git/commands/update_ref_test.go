package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/go-git/go-git/v5/plumbing"
	"github.com/kurobon/gitgym/backend/internal/git"
)

// helper to create a session with an initialized repo and one commit
func setupUpdateRefTestSession(t *testing.T, sm *git.SessionManager, id string) *git.Session {
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

func TestUpdateRefCommand(t *testing.T) {
	sm := git.NewSessionManager()
	s := setupUpdateRefTestSession(t, sm, "test-update-ref")
	ctx := context.Background()
	cmd := &UpdateRefCommand{}

	t.Run("Update existing branch", func(t *testing.T) {
		// Create a new branch
		branchCmd := &BranchCommand{}
		_, err := branchCmd.Execute(ctx, s, []string{"branch", "feature"})
		if err != nil {
			t.Fatalf("failed to create branch: %v", err)
		}

		// Get HEAD hash
		repo := s.GetRepo()
		head, _ := repo.Head()
		headHash := head.Hash().String()

		// Update the branch to point to HEAD
		_, err = cmd.Execute(ctx, s, []string{"update-ref", "refs/heads/feature", headHash})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Verify the branch still points to the same commit
		ref, err := repo.Reference(plumbing.ReferenceName("refs/heads/feature"), true)
		if err != nil {
			t.Fatalf("failed to get reference: %v", err)
		}
		if ref.Hash().String() != headHash {
			t.Errorf("expected %s, got %s", headHash, ref.Hash().String())
		}
	})

	t.Run("Update with short name", func(t *testing.T) {
		// Create a second commit to have different hashes
		touchCmd := &TouchCommand{}
		_, _ = touchCmd.Execute(ctx, s, []string{"touch", "file2.txt"})

		addCmd := &AddCommand{}
		_, _ = addCmd.Execute(ctx, s, []string{"add", "."})

		commitCmd := &CommitCommand{}
		_, _ = commitCmd.Execute(ctx, s, []string{"commit", "-m", "Second commit"})

		// Get HEAD hash (new commit)
		repo := s.GetRepo()
		head, _ := repo.Head()
		newHash := head.Hash().String()

		// Update using short name
		_, err := cmd.Execute(ctx, s, []string{"update-ref", "feature", newHash})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Verify
		ref, _ := repo.Reference(plumbing.ReferenceName("refs/heads/feature"), true)
		if ref.Hash().String() != newHash {
			t.Errorf("expected %s, got %s", newHash, ref.Hash().String())
		}
	})

	t.Run("Update with HEAD reference", func(t *testing.T) {
		// Update using HEAD as value
		_, err := cmd.Execute(ctx, s, []string{"update-ref", "refs/heads/feature", "HEAD"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("Delete ref", func(t *testing.T) {
		// Create a branch to delete
		branchCmd := &BranchCommand{}
		_, _ = branchCmd.Execute(ctx, s, []string{"branch", "to-delete"})

		// Delete using update-ref
		_, err := cmd.Execute(ctx, s, []string{"update-ref", "-d", "refs/heads/to-delete"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Verify it's gone
		repo := s.GetRepo()
		_, err = repo.Reference(plumbing.ReferenceName("refs/heads/to-delete"), true)
		if err == nil {
			t.Error("expected reference to be deleted")
		}
	})

	t.Run("Help", func(t *testing.T) {
		result, err := cmd.Execute(ctx, s, []string{"update-ref", "--help"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !strings.Contains(result, "GIT-UPDATE-REF") {
			t.Errorf("expected help text, got: %s", result)
		}
	})

	t.Run("Error on invalid hash", func(t *testing.T) {
		_, err := cmd.Execute(ctx, s, []string{"update-ref", "refs/heads/feature", "invalid-hash"})
		if err == nil {
			t.Error("expected error for invalid hash, got nil")
		}
	})
}
