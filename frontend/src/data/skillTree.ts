export interface SkillCommand {
    id: string;
    name: string;
    description: string;
    disabled?: boolean;
}

export interface SkillLevel {
    id: string;
    name: string;
    description: string;
    color: string;
    textColor: string;
    commands: SkillCommand[];
}

export const SKILL_TREE: SkillLevel[] = [
    {
        id: 'basic',
        name: 'Git Basic',
        description: 'The Essentials: Single-branch workflow',
        color: '#ffffff',
        textColor: '#000000',
        commands: [
            { id: 'init', name: 'git init', description: 'Initialize a new repository', disabled: true },
            { id: 'clone', name: 'git clone', description: 'Clone a repository into a new directory' },
            { id: 'status', name: 'git status', description: 'Check state of working tree' },
            { id: 'add', name: 'git add', description: 'Stage changes' },
            { id: 'commit', name: 'git commit', description: 'Save changes to history' },
            { id: 'push', name: 'git push', description: 'Upload changes to remote' },
            { id: 'pull', name: 'git pull', description: 'Fetch and merge from remote' },
        ]
    },
    {
        id: 'intermediate',
        name: 'Git Intermediate',
        description: 'Branching & Exploration',
        color: '#e5e7eb', // Gray 200
        textColor: '#000000',
        commands: [
            { id: 'branch', name: 'git branch', description: 'Create/List branches' },
            { id: 'switch', name: 'git switch', description: 'Switch branches' },
            { id: 'checkout', name: 'git checkout', description: 'Switch branches or restore files' },
            { id: 'merge', name: 'git merge', description: 'Join histories together' },
            { id: 'fetch', name: 'git fetch', description: 'Download objects and refs' },
            { id: 'diff', name: 'git diff', description: 'Show changes between commits' },
            { id: 'log', name: 'git log', description: 'Show commit logs' },
            { id: 'blame', name: 'git blame', description: 'Show what revision and author last modified each line of a file', disabled: true },
        ]
    },
    {
        id: 'proficient',
        name: 'Git Proficient',
        description: 'Correction & Management',
        color: '#9ca3af', // Gray 400
        textColor: '#000000',
        commands: [
            { id: 'restore', name: 'git restore', description: 'Restore working tree files' },
            { id: 'reset', name: 'git reset', description: 'Reset current HEAD to the specified state' },
            { id: 'rm', name: 'git rm', description: 'Remove files from the working tree' },
            { id: 'clean', name: 'git clean', description: 'Remove untracked files' },
            { id: 'tag', name: 'git tag', description: 'Create, list, delete or verify tag object' },
            { id: 'remote', name: 'git remote', description: 'Manage tracked repositories' },
            { id: 'show', name: 'git show', description: 'Show various types of objects' },
            { id: 'stash', name: 'git stash', description: 'Stash the changes in a dirty working directory away', disabled: true },
        ]
    },
    {
        id: 'advanced',
        name: 'Git Advanced',
        description: 'Rewrite & Internals',
        color: '#6b7280', // Gray 500
        textColor: '#ffffff',
        commands: [
            { id: 'rebase', name: 'git rebase', description: 'Reapply commits on top of another base tip' },
            { id: 'cherry_pick', name: 'git cherry-pick', description: 'Apply changes introduced by some existing commits' },
            { id: 'reflog', name: 'git reflog', description: 'Manage reflog information' },
            { id: 'worktree', name: 'git worktree', description: 'Manage multiple working trees', disabled: true },
        ]
    }
];
