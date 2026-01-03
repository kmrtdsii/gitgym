package commands

import (
	"context"
	"strings"
	"testing"
	"time"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestLogCommand_Options(t *testing.T) {
	sm := git.NewSessionManager()
	s, _ := sm.CreateSession("test-log")

	// Init
	s.InitRepo("testrepo")
	s.CurrentDir = "/testrepo"

	repo := s.GetRepo()
	w, _ := repo.Worktree()

	// Create 5 commits
	for i := 1; i <= 5; i++ {
		f, _ := w.Filesystem.Create("file.txt")
		f.Write([]byte("content " + string(rune('0'+i))))
		f.Close()
		w.Add(".")
		w.Commit("commit "+string(rune('0'+i)), &gogit.CommitOptions{
			Author: &object.Signature{Name: "Test User", Email: "test@example.com", When: time.Now()},
		})
	}

	cmd := &LogCommand{}
	ctx := context.Background()

	t.Run("Log default", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"log"})
		if err != nil {
			t.Fatalf("Log failed: %v", err)
		}
		// Should contain all 5 commits
		if strings.Count(res, "commit ") < 5 {
			t.Errorf("Expected 5 commits, got fewer")
		}
	})

	t.Run("Log oneline", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"log", "--oneline"})
		if err != nil {
			t.Fatalf("Log --oneline failed: %v", err)
		}
		lines := strings.Split(strings.TrimSpace(res), "\n")
		if len(lines) < 5 {
			t.Errorf("Expected 5 lines, got %d", len(lines))
		}
	})

	t.Run("Log -n 3", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"log", "-n", "3", "--oneline"})
		if err != nil {
			t.Fatalf("Log -n 3 failed: %v", err)
		}
		lines := strings.Split(strings.TrimSpace(res), "\n")
		if len(lines) != 3 {
			t.Errorf("Expected 3 lines, got %d", len(lines))
		}
	})

	t.Run("Log -n2 format", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"log", "-n2", "--oneline"})
		if err != nil {
			t.Fatalf("Log -n2 failed: %v", err)
		}
		lines := strings.Split(strings.TrimSpace(res), "\n")
		if len(lines) != 2 {
			t.Errorf("Expected 2 lines, got %d", len(lines))
		}
	})

	t.Run("Log --graph", func(t *testing.T) {
		res, err := cmd.Execute(ctx, s, []string{"log", "--graph", "--oneline", "-n", "3"})
		if err != nil {
			t.Fatalf("Log --graph failed: %v", err)
		}
		if !strings.Contains(res, "*") {
			t.Errorf("Expected graph characters, got: %s", res)
		}
	})
}
