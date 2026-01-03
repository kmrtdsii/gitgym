package commands

import (
	"context"
	"fmt"
	"strings"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("diff", func() git.Command { return &DiffCommand{} })
}

type DiffCommand struct{}

// Ensure DiffCommand implements git.Command
var _ git.Command = (*DiffCommand)(nil)

type DiffOptions struct {
	Cached   bool
	Stat     bool
	NameOnly bool
	Ref1     string
	Ref2     string
}

func (c *DiffCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	s.Lock()
	defer s.Unlock()

	opts, err := c.parseArgs(args)
	if err != nil {
		return "", err
	}

	repo := s.GetRepo()
	if repo == nil {
		return "", fmt.Errorf("fatal: not a git repository")
	}

	return c.executeDiff(s, repo, opts)
}

func (c *DiffCommand) parseArgs(args []string) (*DiffOptions, error) {
	opts := &DiffOptions{}
	var refs []string

	cmdArgs := args[1:]
	for _, arg := range cmdArgs {
		switch arg {
		case "--cached", "--staged":
			opts.Cached = true
		case "--stat":
			opts.Stat = true
		case "--name-only":
			opts.NameOnly = true
		case "-h", "--help":
			return nil, fmt.Errorf("help requested")
		default:
			if !strings.HasPrefix(arg, "-") {
				refs = append(refs, arg)
			}
		}
	}

	if len(refs) > 0 {
		opts.Ref1 = refs[0]
	}
	if len(refs) > 1 {
		opts.Ref2 = refs[1]
	}

	// Validation
	// git diff -> Ref1="", Ref2="", Cached=false
	// git diff --cached -> Ref1="", Ref2="", Cached=true
	// git diff commit -> Ref1="commit", Ref2="", Cached=false

	return opts, nil
}

func (c *DiffCommand) executeDiff(s *git.Session, repo *gogit.Repository, opts *DiffOptions) (string, error) {
	var tree1, tree2 *object.Tree
	var err error

	// 1. Resolve Tree 2 (Target)
	if opts.Ref2 != "" {
		// git diff ref1 ref2
		h2, err := repo.ResolveRevision(plumbing.Revision(opts.Ref2))
		if err != nil {
			return "", fmt.Errorf("could not resolve %s: %w", opts.Ref2, err)
		}
		commit2, err := repo.CommitObject(*h2)
		if err != nil {
			return "", err
		}
		tree2, err = commit2.Tree()
		if err != nil {
			return "", err
		}
	} else if opts.Ref1 != "" && !opts.Cached {
		// git diff ref1 -> ref1 vs Worktree
		// Standard Git: git diff <commit> compares <commit> with working tree
		tree2, err = s.GetWorktreeTree(repo)
		if err != nil {
			return "", fmt.Errorf("failed to build worktree tree: %w", err)
		}
	} else if opts.Cached {
		// git diff --cached -> Index vs HEAD
		tree2, err = s.GetIndexTree(repo)
		if err != nil {
			return "", fmt.Errorf("failed to build index tree: %w", err)
		}
	} else {
		// git diff -> Worktree vs Index (or HEAD if no index?)
		// Standard Git: compares working directory with index
		tree2, err = s.GetWorktreeTree(repo)
		if err != nil {
			return "", fmt.Errorf("failed to build worktree tree: %w", err)
		}
	}

	// 2. Resolve Tree 1 (Base)
	if opts.Ref1 != "" {
		h1, err := repo.ResolveRevision(plumbing.Revision(opts.Ref1))
		if err != nil {
			return "", fmt.Errorf("could not resolve %s: %w", opts.Ref1, err)
		}
		commit1, err := repo.CommitObject(*h1)
		if err != nil {
			return "", err
		}
		tree1, err = commit1.Tree()
		if err != nil {
			return "", err
		}
	} else if opts.Cached {
		// git diff --cached -> Index vs HEAD. Base is HEAD.
		head, err := repo.Head()
		if err != nil {
			// No commits yet, compare with empty tree
			tree1 = &object.Tree{}
		} else {
			commit1, err := repo.CommitObject(head.Hash())
			if err != nil {
				return "", err
			}
			tree1, err = commit1.Tree()
			if err != nil {
				return "", err
			}
		}
	} else {
		// git diff -> Worktree vs Index. Base is Index.
		tree1, err = s.GetIndexTree(repo)
		if err != nil {
			// If index tree fails (e.g. empty repo), fallback to HEAD or empty
			head, err := repo.Head()
			if err != nil {
				tree1 = &object.Tree{}
			} else {
				commit1, _ := repo.CommitObject(head.Hash())
				tree1, _ = commit1.Tree()
			}
		}
	}

	if tree1 == nil || tree2 == nil {
		return "", fmt.Errorf("internal error: could not resolve trees for diff")
	}

	patch, err := tree1.Patch(tree2)
	if err != nil {
		return "", err
	}

	// Format output based on options
	if opts.NameOnly {
		return c.formatNameOnly(patch), nil
	}
	if opts.Stat {
		return c.formatStat(patch), nil
	}

	return patch.String(), nil
}

func (c *DiffCommand) formatNameOnly(patch *object.Patch) string {
	var sb strings.Builder
	for _, fp := range patch.FilePatches() {
		from, to := fp.Files()
		var name string
		if to != nil {
			name = to.Path()
		} else if from != nil {
			name = from.Path()
		}
		if name != "" {
			sb.WriteString(name)
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

func (c *DiffCommand) formatStat(patch *object.Patch) string {
	var sb strings.Builder
	var totalAdd, totalDel int
	var maxLen int

	type fileStat struct {
		name string
		add  int
		del  int
	}
	var stats []fileStat

	for _, fp := range patch.FilePatches() {
		from, to := fp.Files()
		var name string
		if to != nil {
			name = to.Path()
		} else if from != nil {
			name = from.Path()
		}

		var add, del int
		for _, chunk := range fp.Chunks() {
			lines := strings.Split(chunk.Content(), "\n")
			for range lines {
				switch chunk.Type() {
				case 1: // Add
					add++
				case 2: // Delete
					del++
				}
			}
			// Adjust for empty trailing line
			if len(lines) > 0 && lines[len(lines)-1] == "" {
				switch chunk.Type() {
				case 1:
					add--
				case 2:
					del--
				}
			}
		}

		if len(name) > maxLen {
			maxLen = len(name)
		}
		stats = append(stats, fileStat{name: name, add: add, del: del})
		totalAdd += add
		totalDel += del
	}

	// Format each file
	for _, st := range stats {
		changes := st.add + st.del
		bar := strings.Repeat("+", st.add) + strings.Repeat("-", st.del)
		if len(bar) > 50 {
			// Scale down for very large changes
			scale := float64(50) / float64(changes)
			bar = strings.Repeat("+", int(float64(st.add)*scale)) +
				strings.Repeat("-", int(float64(st.del)*scale))
		}
		sb.WriteString(fmt.Sprintf(" %-*s | %3d %s\n", maxLen, st.name, changes, bar))
	}

	// Summary line
	sb.WriteString(fmt.Sprintf(" %d file(s) changed, %d insertion(s)(+), %d deletion(s)(-)\n",
		len(stats), totalAdd, totalDel))

	return sb.String()
}

func (c *DiffCommand) Help() string {
	return `📘 GIT-DIFF (1)                                         Git Manual

 💡 DESCRIPTION
    ・2つのコミットを比較して、変更内容（差分）を表示する
    ・ファイルの中身が具体的にどう変わったかを確認する

 📋 SYNOPSIS
    git diff [options] [<commit>] [<commit>]

 ⚙️  OPTIONS
    --cached, --staged
        インデックス（ステージングエリア）とHEADの差分を表示

    --stat
        変更されたファイルのリストと追加・削除行数のサマリーを表示

    --name-only
        変更されたファイル名のみを表示

 🛠  EXAMPLES
    1. 2つのコミットを比較
       $ git diff HEAD~1 HEAD

    2. ブランチ間を比較
       $ git diff main develop

    3. 変更ファイルと行数のサマリー
       $ git diff --stat HEAD~1 HEAD

    4. 変更ファイル名のみ
       $ git diff --name-only HEAD~1 HEAD

 🔗 REFERENCE
    Full documentation: https://git-scm.com/docs/git-diff
`
}
