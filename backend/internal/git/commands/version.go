package commands

import (
	"context"

	"github.com/kurobon/gitgym/backend/internal/git"
)

func init() {
	git.RegisterCommand("version", func() git.Command { return &VersionCommand{} })
}

type VersionCommand struct{}

func (c *VersionCommand) Execute(ctx context.Context, s *git.Session, args []string) (string, error) {
	// Imitate git version output, explicitly identifying as GitGym
	return "git version 2.47.1 (GitGym)", nil
}

func (c *VersionCommand) Help() string {
	return `📘 GIT-VERSION (1)                                      Git Manual

 🚀 NAME
    git-version - GitGymのバージョン情報を表示する

 📋 SYNOPSIS
    git version

 💡 DESCRIPTION
    現在のシミュレータのバージョンを表示します。
`
}
