package commands

import (
	"context"
	"fmt"
	"strings"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("reflog", func() git.Command { return &ReflogCommand{} })
}

type ReflogCommand struct{}

func (c *ReflogCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	s.Lock()
	defer s.Unlock()

	repo := s.GetRepo()
	if repo == nil {
		return "", fmt.Errorf("fatal: not a git repository")
	}

	// Parse flags
	cmdArgs := args[1:]
	for i := 0; i < len(cmdArgs); i++ {
		arg := cmdArgs[i]
		switch arg {
		case "-h", "--help":
			return c.Help(), nil
		default:
			// reflog usually takes subcommand "show", "expire", "delete", "exists"
			// default is "show"
			// implementing simple loop for help support
		}
	}

	var sb strings.Builder
	for i, entry := range s.Reflog {
		sb.WriteString(fmt.Sprintf("%s HEAD@{%d}: %s\n", entry.Hash[:7], i, entry.Message))
	}
	return sb.String(), nil
}

func (c *ReflogCommand) Help() string {
	return `📘 GIT-REFLOG (1)                                       Git Manual

 🚀 NAME
    git-reflog - 参照ログ（HEADの動き）を管理・表示する

 📋 SYNOPSIS
    git reflog

 💡 DESCRIPTION
    ローカルリポジトリでの HEAD の更新履歴を表示します。
    ` + "`git reset`" + ` や ` + "`git rebase`" + ` などで失われたコミットを探す際に役立ちます。

 🛠  EXAMPLES
    1. HEADの履歴を表示
       $ git reflog

 🔗 REFERENCE
    Full documentation: https://git-scm.com/docs/git-reflog
`
}
