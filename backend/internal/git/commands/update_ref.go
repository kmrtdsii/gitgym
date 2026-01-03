package commands

import (
	"context"
	"fmt"
	"strings"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("update-ref", func() git.Command { return &UpdateRefCommand{} })
}

// UpdateRefCommand implements the git update-ref command.
type UpdateRefCommand struct{}

// Ensure UpdateRefCommand implements git.Command
var _ git.Command = (*UpdateRefCommand)(nil)

func (c *UpdateRefCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	s.Lock()
	defer s.Unlock()

	repo := s.GetRepo()
	if repo == nil {
		return "", fmt.Errorf("fatal: not a git repository (or any of the parent directories): .git")
	}

	opts, err := c.parseArgs(args)
	if err != nil {
		if err.Error() == "help requested" {
			return c.Help(), nil
		}
		return "", err
	}

	// Delete mode: git update-ref -d <ref>
	if opts.Delete {
		return c.deleteRef(repo, opts.Ref)
	}

	// Update mode: git update-ref <ref> <newvalue>
	return c.updateRef(repo, opts.Ref, opts.NewValue)
}

type updateRefOptions struct {
	Ref      string
	NewValue string
	OldValue string // For conditional update (not implemented yet)
	Delete   bool
	NoDeref  bool
}

func (c *UpdateRefCommand) parseArgs(args []string) (*updateRefOptions, error) {
	opts := &updateRefOptions{}
	cmdArgs := args[1:] // Skip "update-ref"

	positional := []string{}
	for i := 0; i < len(cmdArgs); i++ {
		arg := cmdArgs[i]
		switch arg {
		case "-h", "--help":
			return nil, fmt.Errorf("help requested")
		case "-d", "--delete":
			opts.Delete = true
		case "--no-deref":
			opts.NoDeref = true
		case "-m":
			// Skip reason message (next arg)
			if i+1 < len(cmdArgs) {
				i++
			}
		default:
			if strings.HasPrefix(arg, "-") {
				return nil, fmt.Errorf("error: unknown option: %s", arg)
			}
			positional = append(positional, arg)
		}
	}

	if len(positional) < 1 {
		return nil, fmt.Errorf("usage: git update-ref <ref> <newvalue> [<oldvalue>]")
	}

	opts.Ref = positional[0]

	if opts.Delete {
		// For delete, ref is enough
		if len(positional) >= 2 {
			opts.OldValue = positional[1]
		}
	} else {
		if len(positional) < 2 {
			return nil, fmt.Errorf("usage: git update-ref <ref> <newvalue> [<oldvalue>]")
		}
		opts.NewValue = positional[1]
		if len(positional) >= 3 {
			opts.OldValue = positional[2]
		}
	}

	return opts, nil
}

func (c *UpdateRefCommand) updateRef(repo *gogit.Repository, refName string, newValue string) (string, error) {
	// Resolve new value to hash
	hash, err := repo.ResolveRevision(plumbing.Revision(newValue))
	if err != nil {
		return "", fmt.Errorf("fatal: '%s': not a valid SHA1", newValue)
	}

	// Ensure ref has refs/ prefix
	ref := refName
	if !strings.HasPrefix(ref, "refs/") {
		ref = "refs/heads/" + ref
	}

	newRef := plumbing.NewHashReference(plumbing.ReferenceName(ref), *hash)
	if err := repo.Storer.SetReference(newRef); err != nil {
		return "", fmt.Errorf("error: unable to update ref %s: %w", refName, err)
	}

	return "", nil
}

func (c *UpdateRefCommand) deleteRef(repo *gogit.Repository, refName string) (string, error) {
	// Ensure ref has refs/ prefix
	ref := refName
	if !strings.HasPrefix(ref, "refs/") {
		ref = "refs/heads/" + ref
	}

	if err := repo.Storer.RemoveReference(plumbing.ReferenceName(ref)); err != nil {
		return "", fmt.Errorf("error: cannot delete ref %s: %w", refName, err)
	}

	return "", nil
}

func (c *UpdateRefCommand) Help() string {
	return `📘 GIT-UPDATE-REF (1)                                    Git Manual

 💡 DESCRIPTION
    参照（ブランチやタグ）が指すコミットを直接更新する低レベル（Plumbing）コマンドです。
    主にブランチのポインタを特定のコミットに移動するのに使います。

 📋 SYNOPSIS
    git update-ref <ref> <newvalue>
    git update-ref -d <ref>

 ⚙️  COMMON OPTIONS
    -d, --delete
        指定した参照を削除します。

    --no-deref
        シンボリックリンクを辿らず、参照を直接更新します。

    -m <reason>
        reflogに記録するメッセージを指定します。

 🛠  PRACTICAL EXAMPLES
    1. ブランチを特定のコミットに移動
       $ git update-ref refs/heads/main abc1234

    2. 短縮形式（refs/heads/が自動補完）
       $ git update-ref main HEAD~3

    3. ブランチの削除
       $ git update-ref -d refs/heads/old-branch

 💡 TIPS
    - git reset --soft を使わずに、ブランチポインタだけを移動したい場合に便利
    - インデックスやワーキングツリーは変更されません

 🔗 REFERENCE
    Full documentation: https://git-scm.com/docs/git-update-ref
`
}
