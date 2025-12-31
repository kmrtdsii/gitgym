package state

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/go-git/go-billy/v5/memfs"
	gogit "github.com/go-git/go-git/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateBareRepository(t *testing.T) {
	// Setup temp dir for GITGYM_DATA_ROOT
	tmpDir := t.TempDir()
	t.Setenv("GITGYM_DATA_ROOT", tmpDir)

	// Initialize SessionManager
	sm := &SessionManager{
		sessions:          make(map[string]*Session),
		SharedRemotes:     make(map[string]*gogit.Repository),
		SharedRemotePaths: make(map[string]string),
	}

	// Create a mock session
	sessionID := "test-session-id"
	session := &Session{
		ID:         sessionID,
		Filesystem: memfs.New(),
		Repos:      make(map[string]*gogit.Repository),
		CurrentDir: "/",
	}
	sm.sessions[sessionID] = session

	t.Run("Success", func(t *testing.T) {
		repoName := "my-new-repo"
		err := sm.CreateBareRepository(context.Background(), sessionID, repoName)
		require.NoError(t, err)

		// 1. Check if repo was registered in SharedRemotes
		assert.Contains(t, sm.SharedRemotes, repoName)
		assert.Contains(t, sm.SharedRemotePaths, repoName)

		// 2. Check if directory exists on disk
		repoPath := sm.SharedRemotePaths[repoName]
		assert.DirExists(t, repoPath)
		assert.True(t, filepath.Base(filepath.Dir(repoPath)) == "remotes")

		// CreateBareRepository only creates the remote. Ideally, clients would then clone it.
		// We do NOT check session state here as it shouldn't be modified.
	})

	t.Run("Invalid Name", func(t *testing.T) {
		err := sm.CreateBareRepository(context.Background(), sessionID, "invalid name!")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid repository name")
	})

	t.Run("Multiple Repos Coexist", func(t *testing.T) {
		// Create another repo - both should coexist (multi-remote support)
		repoName2 := "another-repo"
		err := sm.CreateBareRepository(context.Background(), sessionID, repoName2)
		require.NoError(t, err)

		assert.Contains(t, sm.SharedRemotes, repoName2)
		// Multi-remote: both should exist
		assert.Contains(t, sm.SharedRemotes, "my-new-repo", "Both repos should coexist")
	})
}

// TestRemoveRemote tests the RemoveRemote function including PR cleanup
func TestRemoveRemote(t *testing.T) {
	tmpDir := t.TempDir()
	t.Setenv("GITGYM_DATA_ROOT", tmpDir)

	sm := &SessionManager{
		sessions:          make(map[string]*Session),
		SharedRemotes:     make(map[string]*gogit.Repository),
		SharedRemotePaths: make(map[string]string),
		PullRequests:      []*PullRequest{},
	}

	sessionID := "test-session"
	session := &Session{
		ID:         sessionID,
		Filesystem: memfs.New(),
		Repos:      make(map[string]*gogit.Repository),
		CurrentDir: "/",
	}
	sm.sessions[sessionID] = session

	t.Run("RemoveRemote clears SharedRemotes and associated PRs", func(t *testing.T) {
		// Setup: Create a bare repository
		err := sm.CreateBareRepository(context.Background(), sessionID, "test-repo")
		require.NoError(t, err)
		assert.Contains(t, sm.SharedRemotes, "test-repo")

		// Add some PRs - these belong to test-repo
		sm.PullRequests = []*PullRequest{
			{ID: 1, Title: "PR1", State: "OPEN", RemoteName: "test-repo"},
			{ID: 2, Title: "PR2", State: "OPEN", RemoteName: "test-repo"},
		}
		require.Len(t, sm.PullRequests, 2)

		// Execute RemoveRemote
		err = sm.RemoveRemote("test-repo")
		require.NoError(t, err)

		// Verify: SharedRemotes should be empty
		assert.Empty(t, sm.SharedRemotes, "SharedRemotes should be cleared")
		assert.Empty(t, sm.SharedRemotePaths, "SharedRemotePaths should be cleared")

		// Verify: PullRequests belonging to test-repo should be removed
		assert.Empty(t, sm.PullRequests, "PRs for test-repo should be cleared")
	})

	t.Run("RemoveRemote returns error for non-existent remote", func(t *testing.T) {
		err := sm.RemoveRemote("non-existent")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}

// TestMultipleRemotesCoexistence tests that multiple remotes can coexist
// Note: This reflects the current implementation behavior. If Single Residency
// is desired in the future, this test should be updated accordingly.
func TestMultipleRemotesCoexistence(t *testing.T) {
	tmpDir := t.TempDir()
	t.Setenv("GITGYM_DATA_ROOT", tmpDir)

	sm := &SessionManager{
		sessions:          make(map[string]*Session),
		SharedRemotes:     make(map[string]*gogit.Repository),
		SharedRemotePaths: make(map[string]string),
		PullRequests:      []*PullRequest{},
	}

	sessionID := "test-session"
	session := &Session{
		ID:         sessionID,
		Filesystem: memfs.New(),
		Repos:      make(map[string]*gogit.Repository),
		CurrentDir: "/",
	}
	sm.sessions[sessionID] = session

	t.Run("Creating Repo B does NOT remove Repo A (Multi-Remote)", func(t *testing.T) {
		// Create Repo A
		err := sm.CreateBareRepository(context.Background(), sessionID, "repo-A")
		require.NoError(t, err)
		assert.Contains(t, sm.SharedRemotes, "repo-A")

		// Create Repo B
		err = sm.CreateBareRepository(context.Background(), sessionID, "repo-B")
		require.NoError(t, err)

		// CURRENT BEHAVIOR: Both remotes should exist
		assert.Contains(t, sm.SharedRemotes, "repo-A", "repo-A should still exist")
		assert.Contains(t, sm.SharedRemotes, "repo-B", "repo-B should exist")

		// 6 keys total: 3 per repo (name, pseudoURL, path)
		assert.Equal(t, 6, len(sm.SharedRemotes), "Should have 6 keys for two repos")
	})
}
