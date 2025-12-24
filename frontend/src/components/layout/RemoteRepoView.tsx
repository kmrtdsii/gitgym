import React, { useMemo, useState, useEffect } from 'react';
import { useGit } from '../../context/GitAPIContext';
import GitGraphViz from '../visualization/GitGraphViz';
import type { GitState } from '../../types/gitTypes';
import { RemoteHeader, RemoteBranchList, PullRequestSection, CloneProgress, containerStyle } from './remote';
import EmptyState from './remote/EmptyState';
import { filterReachableCommits } from '../../utils/graphUtils';
import { useRemoteClone } from '../../hooks/useRemoteClone';
import { useAutoDiscovery } from '../../hooks/useAutoDiscovery';

interface RemoteRepoViewProps {
    topHeight: number;
    onResizeStart: () => void;
}

/**
 * RemoteRepoView - Right panel showing the remote repository state.
 * Refactored to use 'useRemoteClone' and 'useAutoDiscovery' hooks.
 */
const RemoteRepoView: React.FC<RemoteRepoViewProps> = ({ topHeight, onResizeStart }) => {
    const {
        serverState,
        pullRequests,
        mergePullRequest,
        refreshPullRequests,
        createPullRequest,
    } = useGit();

    // Custom Hooks
    const {
        cloneStatus,
        setCloneStatus,
        estimatedSeconds,
        elapsedSeconds,
        repoInfo,
        errorMessage,
        performClone,
        cancelClone
    } = useRemoteClone();

    // Local UI State
    const [setupUrl, setSetupUrl] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    // Auto Discovery
    useAutoDiscovery({ setupUrl, setSetupUrl, cloneStatus, performClone });

    // Initial Load
    useEffect(() => {
        refreshPullRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handlers
    const onCloneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupUrl) return;
        await performClone(setupUrl);
    };

    // Close edit mode on success
    useEffect(() => {
        if (cloneStatus === 'complete') {
            setIsEditMode(false);
        }
    }, [cloneStatus]);

    const handleRetry = () => {
        if (setupUrl) performClone(setupUrl);
    };

    const handleEditRemote = () => {
        const currentUrl = setupUrl || (serverState?.remotes?.[0]?.urls?.[0]) || '';
        setSetupUrl(currentUrl);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setCloneStatus('idle');
    };

    // Computed Values
    const remoteGraphState: GitState = useMemo(() => {
        if (!serverState) {
            return createEmptyGitState();
        }

        // Transform remoteBranches (origin/xxx) to be displayed as local branches (xxx)
        const mappedBranches: Record<string, string> = {};
        const remotePrefix = 'origin/'; // Assuming origin for now
        let remoteHeadId: string | undefined;

        Object.entries(serverState.remoteBranches || {}).forEach(([ref, commitId]) => {
            if (ref.startsWith(remotePrefix)) {
                const shortName = ref.slice(remotePrefix.length);
                if (shortName === 'HEAD') {
                    remoteHeadId = commitId;
                } else {
                    mappedBranches[shortName] = commitId;
                }
            }
        });

        // Determine synthetic HEAD for the remote view
        let newHEAD = { type: 'none', ref: null } as any;
        // 1. Try to use remote HEAD if available
        if (remoteHeadId) {
            // Check if it matches a known branch
            const branchMatch = Object.entries(mappedBranches).find(([_, id]) => id === remoteHeadId);
            if (branchMatch) {
                newHEAD = { type: 'branch', ref: branchMatch[0] };
            } else {
                newHEAD = { type: 'commit', id: remoteHeadId };
            }
        } else {
            // 2. Fallback: If 'main' or 'master' exists, treat as HEAD for visualization?
            // Or just leave as none. User said "HEAD and main ...", so HEAD likely exists or they want it.
            // If we can't find origin/HEAD, we shouldn't fake it too much.
            // But usually git clone sets it.
            if (mappedBranches['main']) {
                newHEAD = { type: 'branch', ref: 'main' };
            } else if (mappedBranches['master']) {
                newHEAD = { type: 'branch', ref: 'master' };
            }
        }

        // Construct the synthetic state representing the remote
        const syntheticState: GitState = {
            ...serverState,
            branches: mappedBranches,      // Show origin/xxx as xxx
            remoteBranches: {},            // Hide the actual remote/xxx refs
            HEAD: newHEAD,                 // Use remote HEAD
            // Tags from serverState are usually shared, so keep them.
            // Staging/Modified etc should probably be empty for remote view?
            staging: [],
            modified: [],
            untracked: [],
        };

        // Filter commits to only those reachable from remote refs
        return {
            ...syntheticState,
            commits: filterReachableCommits(serverState.commits, syntheticState)
        };
    }, [serverState]);

    // const remoteBranches = remoteGraphState.remoteBranches || {};
    const remoteUrl = setupUrl || (serverState?.remotes?.[0]?.urls?.[0]) || '';
    const projectName = remoteUrl.split('/').pop()?.replace('.git', '') || 'Remote Repository';
    const hasSharedRemotes = !!serverState;
    const isSettingUp = cloneStatus === 'fetching_info' || cloneStatus === 'cloning';

    return (
        <div style={containerStyle}>
            {/* TOP SPLIT: Info & Graph */}
            <div style={{ height: topHeight, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0 }}>
                <RemoteHeader
                    remoteUrl={remoteUrl}
                    projectName={projectName}
                    isEditMode={isEditMode}
                    isSettingUp={isSettingUp}
                    setupUrl={setupUrl}
                    onSetupUrlChange={setSetupUrl}
                    onEditRemote={handleEditRemote}
                    onCancelEdit={handleCancelEdit}
                    onSubmit={onCloneSubmit}
                />

                {/* Clone Progress Display */}
                {cloneStatus !== 'idle' && (
                    <div style={{ padding: '0 16px' }}>
                        <CloneProgress
                            status={cloneStatus}
                            estimatedSeconds={estimatedSeconds}
                            elapsedSeconds={elapsedSeconds}
                            repoInfo={repoInfo}
                            errorMessage={errorMessage}
                            onRetry={handleRetry}
                            onCancel={cancelClone}
                        />
                    </div>
                )}

                {/* Graph Area */}
                <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'var(--bg-primary)' }}>
                    {hasSharedRemotes ? (
                        <GitGraphViz state={remoteGraphState} />
                    ) : (
                        <EmptyState
                            isEditMode={isEditMode}
                            cloneStatus={cloneStatus}
                            onConnect={handleEditRemote}
                        />
                    )}
                </div>
            </div>

            {/* Resizer */}
            <div
                className="resizer"
                onMouseDown={onResizeStart}
                style={{
                    height: '4px',
                    cursor: 'row-resize',
                    background: 'var(--border-subtle)',
                    width: '100%',
                    zIndex: 10
                }}
            />

            {/* BOTTOM SPLIT: Remote Operations */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                <PullRequestSection
                    pullRequests={pullRequests}
                    branches={remoteGraphState.branches}
                    onCreatePR={createPullRequest}
                    onMergePR={mergePullRequest}
                />
                <RemoteBranchList remoteBranches={remoteGraphState.branches} />
            </div>
        </div>
    );
};

/**
 * Creates an empty GitState object for initial/fallback state.
 */
function createEmptyGitState(): GitState {
    return {
        commits: [],
        branches: {},
        tags: {},
        references: {},
        remotes: [],
        remoteBranches: {},
        HEAD: { type: 'none', ref: null },
        staging: [],
        modified: [],
        untracked: [],
        fileStatuses: {},
        files: [],
        potentialCommits: [],
        sharedRemotes: [],
        output: [],
        commandCount: 0,
        initialized: false
    };
}

export default RemoteRepoView;
