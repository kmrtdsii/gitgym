package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestInitCommand_Execute_Disabled(t *testing.T) {
	sm := git.NewSessionManager()
	s, _ := sm.CreateSession("test-init-disabled")
	cmd := &InitCommand{}

	// Test init execution
	res, err := cmd.Execute(context.Background(), s, []string{"init"})
	if err != nil {
		t.Fatalf("Execute failed: %v", err)
	}

	expected := "GitGymでは `git init` はサポートされていません"
	if !strings.Contains(res, expected) {
		t.Errorf("Expected disabled message '%s', got: %s", expected, res)
	}

	// Verify no repo was created (optional, but good sanity check)
	if len(s.Repos) > 0 {
		t.Error("Expected no repos to be created")
	}
}
