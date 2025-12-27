package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func TestInitCommand_Execute_Disabled(t *testing.T) {
	// Setup
	s := &git.Session{}
	cmd := &InitCommand{}

	// Test init execution
	res, err := cmd.Execute(context.Background(), s, []string{"init"})
	// Init might return error or just message depending on implementation
	if err != nil {
		if !strings.Contains(err.Error(), "disabled") && !strings.Contains(err.Error(), "not supported") {
			t.Errorf("Unexpected error: %v", err)
		}
	} else {
		expected := "GitGymでは `git init` はサポートされていません"
		if !strings.Contains(res, expected) {
			t.Errorf("Expected disabled message '%s', got: %s", expected, res)
		}
	}

	// If Help test fails, let's debug it here by printing output
	// But standard test runner hides output unless failure.
}
