// Git Dojo Problem Definitions
// Quiz-style learning challenges

export type DojoDifficulty = 1 | 2 | 3;
export type DojoCategory = 'basic' | 'intermediate' | 'advanced';

export interface DojoProblem {
    id: string;
    title: string; // i18n key
    description: string; // i18n key
    category: DojoCategory;
    difficulty: DojoDifficulty;
    estimatedMinutes: number;
    prerequisiteIds: string[];

    // Mission Backend linkage
    missionId: string;

    // Goals displayed during challenge
    goals: string[]; // i18n keys

    // Solution content (shown after completion)
    solutionSteps: string[];
    trivia: string; // i18n key
}

export const DOJO_PROBLEMS: DojoProblem[] = [
    // === BASIC ===
    {
        id: '101',
        title: 'dojo.problems.101.title',
        description: 'dojo.problems.101.description',
        category: 'basic',
        difficulty: 1,
        estimatedMinutes: 3,
        prerequisiteIds: [],
        missionId: '101-first-commit',
        goals: [
            'dojo.problems.101.goals.0',
            'dojo.problems.101.goals.1',
        ],
        solutionSteps: [
            'git add README.md',
            'git commit -m "Initial commit"',
        ],
        trivia: 'dojo.problems.101.trivia',
    },
    {
        id: '102',
        title: 'dojo.problems.102.title',
        description: 'dojo.problems.102.description',
        category: 'basic',
        difficulty: 1,
        estimatedMinutes: 3,
        prerequisiteIds: ['101'],
        missionId: '102-create-branch',
        goals: [
            'dojo.problems.102.goals.0',
            'dojo.problems.102.goals.1',
        ],
        solutionSteps: [
            'git branch feature',
            'git switch feature',
            // OR: 'git switch -c feature',
        ],
        trivia: 'dojo.problems.102.trivia',
    },
    {
        id: '103',
        title: 'dojo.problems.103.title',
        description: 'dojo.problems.103.description',
        category: 'basic',
        difficulty: 2,
        estimatedMinutes: 5,
        prerequisiteIds: ['102'],
        missionId: '001-conflict-crisis', // Existing mission
        goals: [
            'dojo.problems.103.goals.0',
            'dojo.problems.103.goals.1',
        ],
        solutionSteps: [
            'git status',
            'vim README.md  # Edit to resolve conflict markers',
            'git add README.md',
            'git commit -m "Resolve merge conflict"',
        ],
        trivia: 'dojo.problems.103.trivia',
    },

    // === INTERMEDIATE ===
    {
        id: '201',
        title: 'dojo.problems.201.title',
        description: 'dojo.problems.201.description',
        category: 'intermediate',
        difficulty: 2,
        estimatedMinutes: 7,
        prerequisiteIds: ['103'],
        missionId: '', // TODO: Create mission
        goals: [
            'dojo.problems.201.goals.0',
            'dojo.problems.201.goals.1',
        ],
        solutionSteps: [
            'git rebase main',
        ],
        trivia: 'dojo.problems.201.trivia',
    },
];

// Helper functions
export const getProblemById = (id: string): DojoProblem | undefined => {
    return DOJO_PROBLEMS.find(p => p.id === id);
};

export const getProblemsByCategory = (category: DojoCategory): DojoProblem[] => {
    return DOJO_PROBLEMS.filter(p => p.category === category);
};

export const getAvailableProblems = (completedIds: string[]): DojoProblem[] => {
    return DOJO_PROBLEMS.filter(p => {
        // All prerequisites must be completed
        return p.prerequisiteIds.every(prereq => completedIds.includes(prereq));
    });
};

export const isLocked = (problem: DojoProblem, completedIds: string[]): boolean => {
    return !problem.prerequisiteIds.every(prereq => completedIds.includes(prereq));
};
