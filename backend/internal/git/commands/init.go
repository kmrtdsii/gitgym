package commands

import (
	"context"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("init", func() git.Command { return &InitCommand{} })
}

type InitCommand struct{}

func (c *InitCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	msg := "GitGymでは `git init` はサポートされていません。\n" +
		"画面左上の設定ボタンからGitHubのリポジトリURLを入力し、クローンして遊んでください！\n" +
		"(例: https://github.com/progit/progit2)"
	return msg, nil
}

func (c *InitCommand) Help() string {
	return "usage: git init [--bare] [directory]"
}
