package main

import (
	"fmt"
	"log"
	"os"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <repo-path>\n", os.Args[0])
		os.Exit(1)
	}
	path := os.Args[1]

	repo, err := git.PlainOpen(path)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("--- Branches ---")
	iter, _ := repo.Branches()
	_ = iter.ForEach(func(r *plumbing.Reference) error {
		fmt.Println(r.Name(), r.Hash())
		return nil
	})

	fmt.Println("--- Tags ---")
	tIter, _ := repo.Tags()
	_ = tIter.ForEach(func(r *plumbing.Reference) error {
		fmt.Println(r.Name(), r.Hash())
		return nil
	})

	fmt.Println("--- HEAD ---")
	h, _ := repo.Head()
	fmt.Println(h.Name(), h.Hash())
}
