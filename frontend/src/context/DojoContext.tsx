import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useMission } from './MissionContext';
import type { DojoProblem } from '../data/dojoProblems';
import { getProblemById, DOJO_PROBLEMS } from '../data/dojoProblems';

type DojoPhase = 'list' | 'challenge' | 'result';

interface DojoState {
    phase: DojoPhase;
    currentProblem: DojoProblem | null;
    startTime: number | null;
    hintsRevealed: number;
    completedProblemIds: string[];
    lastResult: DojoResult | null;
}

export interface DojoResult {
    passed: boolean;
    score: number;
    timeMs: number;
    hintsUsed: number;
}

interface DojoContextType {
    state: DojoState;
    startChallenge: (problemId: string) => Promise<void>;
    submitAnswer: () => Promise<DojoResult>;
    giveUp: () => void;
    revealHint: () => void;
    goToList: () => void;
    nextProblem: () => void;
    isCompleted: (problemId: string) => boolean;
    showResult: (result: DojoResult, missionId: string) => void;
    setOpenModalCallback: (callback: () => void) => void;
    openDojoModal: () => void;
}

const DojoContext = createContext<DojoContextType | undefined>(undefined);

const STORAGE_KEY = 'gitgym-dojo-progress';

export const DojoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { startMission, verifyMission, endMission } = useMission();

    const [state, setState] = useState<DojoState>(() => {
        // Load completed problems from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        const completedProblemIds = stored ? JSON.parse(stored) : [];
        return {
            phase: 'list',
            currentProblem: null,
            startTime: null,
            hintsRevealed: 0,
            completedProblemIds,
            lastResult: null,
        };
    });

    // Persist completed problems
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedProblemIds));
    }, [state.completedProblemIds]);

    const startChallenge = useCallback(async (problemId: string) => {
        const problem = getProblemById(problemId);
        if (!problem) {
            console.error('Problem not found:', problemId);
            return;
        }

        // Start the mission if it has one
        if (problem.missionId) {
            await startMission(problem.missionId);
        }

        setState(prev => ({
            ...prev,
            phase: 'challenge',
            currentProblem: problem,
            startTime: Date.now(),
            hintsRevealed: 0,
            lastResult: null,
        }));
    }, [startMission]);

    const submitAnswer = useCallback(async (): Promise<DojoResult> => {
        const { currentProblem, startTime, hintsRevealed } = state;

        if (!currentProblem) {
            return { passed: false, score: 0, timeMs: 0, hintsUsed: 0 };
        }

        const timeMs = startTime ? Date.now() - startTime : 0;

        // Verify with backend if mission exists
        let passed = false;
        if (currentProblem.missionId) {
            const verifyResult = await verifyMission();
            passed = verifyResult?.success ?? false;
        } else {
            // For problems without missions, auto-pass for now (placeholder)
            passed = true;
        }

        // Calculate score
        let score = 100;
        // Hint penalty: -10 per hint
        score -= hintsRevealed * 10;
        // Time bonus (optional): bonus if under estimated time
        const estimatedMs = currentProblem.estimatedMinutes * 60 * 1000;
        if (timeMs < estimatedMs && passed) {
            score += Math.floor((estimatedMs - timeMs) / 60000) * 5; // +5 per minute under
        }
        score = Math.max(0, Math.min(100, score));

        const result: DojoResult = {
            passed,
            score,
            timeMs,
            hintsUsed: hintsRevealed,
        };

        setState(prev => ({
            ...prev,
            phase: 'result',
            lastResult: result,
            completedProblemIds: passed && !prev.completedProblemIds.includes(currentProblem.id)
                ? [...prev.completedProblemIds, currentProblem.id]
                : prev.completedProblemIds,
        }));

        return result;
    }, [state, verifyMission]);

    const giveUp = useCallback(() => {
        const result: DojoResult = {
            passed: false,
            score: 0,
            timeMs: state.startTime ? Date.now() - state.startTime : 0,
            hintsUsed: state.hintsRevealed,
        };

        setState(prev => ({
            ...prev,
            phase: 'result',
            lastResult: result,
        }));
    }, [state.startTime, state.hintsRevealed]);

    const revealHint = useCallback(() => {
        setState(prev => ({
            ...prev,
            hintsRevealed: prev.hintsRevealed + 1,
        }));
    }, []);

    const goToList = useCallback(() => {
        endMission();
        setState(prev => ({
            ...prev,
            phase: 'list',
            currentProblem: null,
            startTime: null,
            hintsRevealed: 0,
            lastResult: null,
        }));
    }, [endMission]);

    const nextProblem = useCallback(() => {
        // Find next unlocked problem
        const { completedProblemIds, currentProblem } = state;
        if (!currentProblem) {
            goToList();
            return;
        }

        // Import dynamically to avoid circular deps
        import('../data/dojoProblems').then(({ DOJO_PROBLEMS, isLocked }) => {
            const currentIdx = DOJO_PROBLEMS.findIndex(p => p.id === currentProblem.id);
            const nextProblem = DOJO_PROBLEMS.slice(currentIdx + 1).find(p => !isLocked(p, completedProblemIds));

            if (nextProblem) {
                endMission();
                startChallenge(nextProblem.id);
            } else {
                goToList();
            }
        });
    }, [state, endMission, startChallenge, goToList]);

    const isCompleted = useCallback((problemId: string): boolean => {
        return state.completedProblemIds.includes(problemId);
    }, [state.completedProblemIds]);

    const showResult = useCallback((result: DojoResult, missionId: string) => {
        // Find the problem by missionId
        const problem = DOJO_PROBLEMS.find(p => p.missionId === missionId) || null;

        setState(prev => ({
            ...prev,
            phase: 'result',
            currentProblem: problem,
            lastResult: result,
            completedProblemIds: result.passed && problem && !prev.completedProblemIds.includes(problem.id)
                ? [...prev.completedProblemIds, problem.id]
                : prev.completedProblemIds,
        }));
    }, []);

    // Store modal open callback from AppLayout
    const openModalCallbackRef = React.useRef<(() => void) | null>(null);

    const setOpenModalCallback = useCallback((callback: () => void) => {
        openModalCallbackRef.current = callback;
    }, []);

    const openDojoModal = useCallback(() => {
        if (openModalCallbackRef.current) {
            openModalCallbackRef.current();
        }
    }, []);

    return (
        <DojoContext.Provider value={{
            state,
            startChallenge,
            submitAnswer,
            giveUp,
            revealHint,
            goToList,
            nextProblem,
            isCompleted,
            showResult,
            setOpenModalCallback,
            openDojoModal,
        }}>
            {children}
        </DojoContext.Provider>
    );
};

export const useDojo = () => {
    const context = useContext(DojoContext);
    if (!context) {
        throw new Error('useDojo must be used within DojoProvider');
    }
    return context;
};
