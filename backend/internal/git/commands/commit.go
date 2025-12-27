package commands

// commit.go - Simulated Git Commit Command
//
// Records changes to the repository by creating a new commit object.
// Supports -m (message), --amend, and --allow-empty flags.

import (
	"context"
	"fmt"
	"strings"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("commit", func() git.Command { return &CommitCommand{} })
}

type CommitCommand struct{}

// Ensure CommitCommand implements git.Command
var _ git.Command = (*CommitCommand)(nil)

type CommitOptions struct {
	Message    string
	Amend      bool
	AllowEmpty bool
}

type commitContext struct {
	w           *gogit.Worktree
	repo        *gogit.Repository
	message     string
	amendCommit *object.Commit
}

func (c *CommitCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	s.Lock()
	defer s.Unlock()

	// 1. Parse
	opts, err := c.parseArgs(args)
	if err != nil {
		if err.Error() == "help requested" {
			return c.Help(), nil
		}
		return "", err
	}

	repo := s.GetRepo()
	if repo == nil {
		return "", fmt.Errorf("fatal: not a git repository (or any of the parent directories): .git")
	}

	// 2. Resolve
	cCtx, err := c.resolveContext(repo, opts, args)
	if err != nil {
		return "", err
	}

	// 3. Perform
	return c.performAction(s, cCtx, opts)
}

func (c *CommitCommand) parseArgs(args []string) (*CommitOptions, error) {
	opts := &CommitOptions{
		Message: "Default commit message",
	}

	for i := 1; i < len(args); i++ {
		arg := args[i]
		switch arg {
		case "-h", "--help":
			return nil, fmt.Errorf("help requested")
		case "-m":
			if i+1 < len(args) {
				opts.Message = args[i+1]
				i++
			}
		case "--amend":
			opts.Amend = true
		case "--allow-empty":
			opts.AllowEmpty = true
		}
	}
	return opts, nil
}

func (c *CommitCommand) resolveContext(repo *gogit.Repository, opts *CommitOptions, originalArgs []string) (*commitContext, error) {
	w, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	ctx := &commitContext{
		w:    w,
		repo: repo,
	}

	if opts.Amend {
		headRef, err := repo.Head()
		if err != nil {
			return nil, fmt.Errorf("cannot amend without HEAD: %v", err)
		}
		headCommit, err := repo.CommitObject(headRef.Hash())
		if err != nil {
			return nil, err
		}
		ctx.amendCommit = headCommit

		// Handle message reuse for amend
		isMsgProvided := false
		for _, arg := range originalArgs {
			if arg == "-m" {
				isMsgProvided = true
				break
			}
		}

		if isMsgProvided {
			ctx.message = opts.Message
		} else {
			ctx.message = headCommit.Message
		}
	} else {
		ctx.message = opts.Message
	}

	return ctx, nil
}

func (c *CommitCommand) performAction(s *git.Session, ctx *commitContext, opts *CommitOptions) (string, error) {
	var commitOpts gogit.CommitOptions
	commitOpts.Author = git.GetDefaultSignature()
	commitOpts.AllowEmptyCommits = opts.AllowEmpty

	actionLabel := "commit"

	if opts.Amend {
		s.UpdateOrigHead()
		commitOpts.Parents = ctx.amendCommit.ParentHashes
		commitOpts.AllowEmptyCommits = true // Amending generally allowed
		actionLabel = "commit (amend)"
	}

	commitHash, err := ctx.w.Commit(ctx.message, &commitOpts)
	if err != nil {
		if strings.Contains(err.Error(), "clean") || strings.Contains(err.Error(), "nothing to commit") {
			return "", fmt.Errorf("%v\nhint: Use 'git commit --allow-empty -m <message>' to create an empty commit", err)
		}
		return "", err
	}

	s.RecordReflog(fmt.Sprintf("%s: %s", actionLabel, strings.Split(ctx.message, "\n")[0]))

	if opts.Amend {
		return fmt.Sprintf("Commit amended: %s", commitHash.String()), nil
	}
	return fmt.Sprintf("Commit created: %s", commitHash.String()), nil
}

func (c *CommitCommand) Help() string {
	return `📘 GIT-COMMIT (1)                                       Git Manual

 💡 DESCRIPTION
    ・ステージングエリアにある変更を記録する（セーブする）
    ・変更内容にメッセージを付けて保存する

 📋 SYNOPSIS
    git commit -m <msg>
    git commit --amend
    git commit --allow-empty

 ⚙️  COMMON OPTIONS
    -m <msg>
        コミットメッセージを指定します。

    --amend
        直前のコミットを修正します（メッセージの変更や、ファイルの追加忘れ等）。
        元のコミットは上書きされます。

    --allow-empty
        変更が含まれていなくてもコミットを作成できるようにします。

 🛠  EXAMPLES
    1. メッセージ付きでコミット
       $ git commit -m "Initial commit"

    2. 直前のコミットメッセージを修正
       $ git commit --amend -m "Corrected message"

 🔗 REFERENCE
    Full documentation: https://git-scm.com/docs/git-commit
`
}
