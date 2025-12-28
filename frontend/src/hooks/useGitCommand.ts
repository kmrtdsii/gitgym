import { useCallback } from 'react';
import { gitService } from '../services/gitService';
import type { GitDataHook } from './useGitData';

interface UseGitCommandProps {
    sessionId: string;
    gitData: GitDataHook;
}

export const useGitCommand = ({ sessionId, gitData }: UseGitCommandProps) => {
    const {
        fetchState,
        fetchServerState,
        serverState,
        setState,
        updateCommandOutput,
        incrementCommandCount
    } = gitData;

    const runCommand = useCallback(async (cmd: string, options?: { silent?: boolean; skipRefresh?: boolean }): Promise<string[]> => {
        if (!sessionId) {
            console.error("No session ID");
            return [];
        }

        console.log(`Executing command: ${cmd} (Session: ${sessionId})`);

        // 1. Echo Command
        const commandEcho = `> ${cmd}`;

        if (!options?.silent) {
            // Optimistic update using functional update to avoid dependency on state.output
            setState(prev => {
                const newOutput = [...prev.output, commandEcho];
                // Record for session persistence
                updateCommandOutput(sessionId, newOutput);
                return {
                    ...prev,
                    output: newOutput
                };
            });
        }

        try {
            const data = await gitService.executeCommand(sessionId, cmd);
            let responseLines: string[] = [];
            let isError = false;

            if (data.error) {
                responseLines = [`Error: ${data.error}`];
                isError = true;
            } else if (data.output) {
                responseLines = [data.output];
            }

            // 2. Append Output
            if (!options?.silent || isError) {
                setState(prev => {
                    const newOutput = [...prev.output, ...responseLines];
                    updateCommandOutput(sessionId, newOutput);
                    return {
                        ...prev,
                        output: newOutput
                    };
                });
            }

            // 3. Refresh State
            if (!options?.skipRefresh) {
                await fetchState(sessionId);
            }

            // 4. Increment Count & Trigger Prompt
            incrementCommandCount(sessionId);
            setState(prev => ({
                ...prev,
                commandCount: prev.commandCount + 1
            }));

            // 5. Auto-refresh Server State based on command type
            if (!options?.skipRefresh) {
                const isRemoteCommand = ['push', 'pull', 'fetch', 'clone', 'remote'].some(c => cmd.startsWith(`git ${c}`));

                if (isRemoteCommand) {
                    if (serverState && serverState.remotes?.length === 0) {
                        await fetchServerState('origin');
                    } else if (serverState) {
                        // Default fallback refresh
                        await fetchServerState('origin');
                    }
                }
            }

            return responseLines;

        } catch (e) {
            console.error(e);
            const errorLine = "Network error";
            setState(prev => {
                const finalOutput = [...prev.output, errorLine];
                updateCommandOutput(sessionId, finalOutput);
                return {
                    ...prev,
                    output: finalOutput,
                    commandCount: prev.commandCount + 1
                };
            });
            incrementCommandCount(sessionId);
            return [errorLine];
        }
    }, [sessionId, fetchState, fetchServerState, serverState, setState, updateCommandOutput, incrementCommandCount]);

    return { runCommand };
};
