package commands

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-git/go-git/v5/plumbing"
	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("symbolic-ref", func() git.Command { return &SymbolicRefCommand{} })
}

// SymbolicRefCommand implements the git symbolic-ref command.
type SymbolicRefCommand struct{}

// Ensure SymbolicRefCommand implements git.Command
var _ git.Command = (*SymbolicRefCommand)(nil)

func (c *SymbolicRefCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
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

	// Read mode: git symbolic-ref <name>
	if opts.Target == "" {
		return c.readSymbolicRef(repo.Storer, opts.Name, opts.Short)
	}

	// Write mode: git symbolic-ref <name> <ref>
	return c.writeSymbolicRef(repo.Storer, opts.Name, opts.Target)
}

type symbolicRefOptions struct {
	Name   string
	Target string
	Short  bool
	Quiet  bool
}

func (c *SymbolicRefCommand) parseArgs(args []string) (*symbolicRefOptions, error) {
	opts := &symbolicRefOptions{}
	cmdArgs := args[1:] // Skip "symbolic-ref"

	positional := []string{}
	for i := 0; i < len(cmdArgs); i++ {
		arg := cmdArgs[i]
		switch arg {
		case "-h", "--help":
			return nil, fmt.Errorf("help requested")
		case "--short":
			opts.Short = true
		case "-q", "--quiet":
			opts.Quiet = true
		case "-d", "--delete":
			return nil, fmt.Errorf("error: --delete is not supported in GitGym")
		default:
			if strings.HasPrefix(arg, "-") {
				return nil, fmt.Errorf("error: unknown option: %s", arg)
			}
			positional = append(positional, arg)
		}
	}

	if len(positional) < 1 {
		return nil, fmt.Errorf("usage: git symbolic-ref <name> [<ref>]")
	}

	opts.Name = positional[0]
	if len(positional) >= 2 {
		opts.Target = positional[1]
	}

	return opts, nil
}

func (c *SymbolicRefCommand) readSymbolicRef(storer interface {
	Reference(plumbing.ReferenceName) (*plumbing.Reference, error)
}, name string, short bool) (string, error) {
	refName := plumbing.ReferenceName(name)

	ref, err := storer.Reference(refName)
	if err != nil {
		return "", fmt.Errorf("fatal: ref %s is not a symbolic ref", name)
	}

	if ref.Type() != plumbing.SymbolicReference {
		return "", fmt.Errorf("fatal: ref %s is not a symbolic ref", name)
	}

	target := ref.Target()
	if short {
		// Strip "refs/heads/" prefix if present
		targetStr := target.String()
		if strings.HasPrefix(targetStr, "refs/heads/") {
			return strings.TrimPrefix(targetStr, "refs/heads/"), nil
		}
		if strings.HasPrefix(targetStr, "refs/remotes/") {
			return strings.TrimPrefix(targetStr, "refs/remotes/"), nil
		}
		return targetStr, nil
	}

	return target.String(), nil
}

func (c *SymbolicRefCommand) writeSymbolicRef(storer interface {
	SetReference(*plumbing.Reference) error
}, name string, target string) (string, error) {
	refName := plumbing.ReferenceName(name)

	// Ensure target has refs/ prefix
	targetRef := target
	if !strings.HasPrefix(target, "refs/") {
		targetRef = "refs/heads/" + target
	}

	newRef := plumbing.NewSymbolicReference(refName, plumbing.ReferenceName(targetRef))
	if err := storer.SetReference(newRef); err != nil {
		return "", fmt.Errorf("error: unable to update %s: %w", name, err)
	}

	return "", nil
}

func (c *SymbolicRefCommand) Help() string {
	return `📘 GIT-SYMBOLIC-REF (1)                                  Git Manual

 💡 DESCRIPTION
    シンボリック参照を読み書きするための低レベル（Plumbing）コマンドです。
    主にHEADが指しているブランチを確認・変更するのに使います。

 📋 SYNOPSIS
    git symbolic-ref <name>
    git symbolic-ref <name> <ref>

 ⚙️  COMMON OPTIONS
    --short
        結果を短縮形式で表示します。
        例: "refs/heads/main" → "main"

    -q, --quiet
        エラーメッセージを抑制します。

 🛠  PRACTICAL EXAMPLES
    1. HEADが指しているブランチを確認
       $ git symbolic-ref HEAD
       refs/heads/main

    2. 短縮形式で表示
       $ git symbolic-ref --short HEAD
       main

    3. HEADを別のブランチに向ける（上級者向け）
       $ git symbolic-ref HEAD refs/heads/feature

 🔗 REFERENCE
    Full documentation: https://git-scm.com/docs/git-symbolic-ref
`
}
