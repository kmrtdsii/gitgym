#!/bin/bash

# Check if git user.name or user.email is missing
GIT_NAME=$(git config user.name)
GIT_EMAIL=$(git config user.email)

if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
    echo "--------------------------------------------------------"
    echo "⚠️  WARNING: Git identity is not configured!"
    echo "   You will not be able to commit code."
    echo ""
    echo "   Please configure it using one of the methods in:"
    echo "   docs/git-setup.md"
    echo ""
    echo "   Quick fix (temporary):"
    echo "   git config user.name \"Your Name\""
    echo "   git config user.email \"you@example.com\""
    echo "--------------------------------------------------------"
else
    echo "✅ Git identity configured as: $GIT_NAME <$GIT_EMAIL>"
fi
