import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGit } from '../../lib/GitContext';

// Basic constants
const NODE_RADIUS = 16;
const X_SPACING = 80;
const Y_SPACING = 60;
const START_X = 50;
const START_Y = 100;

// Helper to compute layout
const computeLayout = (commits, branches, HEAD) => {
    if (commits.length === 0) return { nodes: [], edges: [] };

    // 1. Assign Lanes based on branch name
    // 'main' is always lane 0
    const laneMap = { 'main': 0 };
    let nextLane = 1;

    // We process commits in order to discover branches
    commits.forEach(c => {
        const branchName = c.branch || 'detached';
        if (laneMap[branchName] === undefined) {
            laneMap[branchName] = nextLane++;
        }
    });

    const positions = {}; // commitId -> { x, y, lane }

    // 2. Compute Positions
    commits.forEach((c, index) => {
        const lane = laneMap[c.branch || 'detached'] || 0;
        positions[c.id] = {
            x: START_X + index * X_SPACING,
            y: START_Y + lane * Y_SPACING,
            lane
        };
    });

    // 3. Generate Nodes
    const nodes = commits.map(c => ({
        ...c,
        ...positions[c.id]
    }));

    // 4. Generate Edges
    const edges = [];
    commits.forEach(c => {
        if (c.parentId) {
            const source = positions[c.parentId];
            const target = positions[c.id];
            if (source && target) {
                // Determine if this is a "branching out" or "merging in" edge visually?
                // Just draw direct lines for now.
                edges.push({
                    id: `${c.parentId}-${c.id}`,
                    x1: source.x, y1: source.y,
                    x2: target.x, y2: target.y,
                    isMerge: false
                });
            }
        }
        if (c.secondParentId) {
            const source = positions[c.secondParentId];
            const target = positions[c.id];
            if (source && target) {
                edges.push({
                    id: `${c.secondParentId}-${c.id}`,
                    x1: source.x, y1: source.y,
                    x2: target.x, y2: target.y,
                    isMerge: true
                });
            }
        }
    });

    // 5. Determine Active Status (HEAD)
    let headCommitId = null;
    if (HEAD.type === 'commit') headCommitId = HEAD.id;
    else if (HEAD.type === 'branch') headCommitId = branches[HEAD.ref];

    return { nodes, edges, headCommitId };
};

const GitGraphViz = () => {
    const { state } = useGit();
    const { commits, branches, HEAD } = state;

    const { nodes, edges, headCommitId } = useMemo(() =>
        computeLayout(commits, branches, HEAD),
        [commits, branches, HEAD]
    );

    if (!state.initialized) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
            }}>
                Type <code>git init</code> to start visualizing.
            </div>
        );
    }

    // Helper to determine file status
    const getFileStatus = (file) => {
        const isStaged = state.staging.includes(file);
        const isModified = state.modified.includes(file);
        if (isStaged) return 'staged';
        if (isModified) return 'modified';
        return 'clean';
    };

    const { runCommand } = useGit();

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                borderBottom: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
                flexShrink: 0
            }}>
                {/* Working Directory Panel Now Shows ALL Files */}
                <div style={{ flex: 1, border: '1px solid var(--border-primary)', borderRadius: '4px', padding: '0.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Working Directory (Files)</h3>
                    {state.files && state.files.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '0', fontSize: '0.85rem', listStyle: 'none' }}>
                            {state.files.map(f => {
                                const status = getFileStatus(f);
                                let color = 'var(--text-tertiary)'; // clean
                                let icon = null;

                                if (status === 'modified') {
                                    color = '#e5534b';
                                } else if (status === 'staged') {
                                    // If staged, it might technically be "clean" in WD relative to Index if fully staged,
                                    // but for our list we just want to show it exists.
                                    // But typically, if fully staged, it's not "modified" in WD.
                                    // Let's show it as "staged" color or keep it clean if we only care about WD diff?
                                    // User wants to see it so they can edit it again.
                                    // If it's staged, we can still edit it to make it modified again.
                                    color = '#238636';
                                }

                                return (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', color }}>
                                        <span>{f} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>({status})</span></span>
                                        {status === 'clean' || status === 'staged' ? (
                                            <button
                                                onClick={() => runCommand(`touch ${f}`)}
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid var(--border-primary)',
                                                    borderRadius: '3px',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.7rem',
                                                    padding: '2px 6px',
                                                    position: 'relative',
                                                    zIndex: 10
                                                }}
                                                title="Edit file (touch)"
                                            >
                                                Edit
                                            </button>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No files</div>
                    )}
                </div>

                <div style={{ flex: 1, border: '1px solid var(--border-primary)', borderRadius: '4px', padding: '0.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#238636', textTransform: 'uppercase' }}>Staging Area</h3>
                    {state.staging && state.staging.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                            {state.staging.map(f => <li key={f} style={{ color: '#238636' }}>{f}</li>)}
                        </ul>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Empty</div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <svg width="2000" height="1000">
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="24"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-active)" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    <AnimatePresence>
                        {edges.map(edge => (
                            <motion.line
                                key={edge.id}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                x1={edge.x1}
                                y1={edge.y1}
                                x2={edge.x2}
                                y2={edge.y2}
                                stroke="var(--border-active)"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        ))}
                    </AnimatePresence>

                    {/* Nodes */}
                    <AnimatePresence>
                        {nodes.map(node => {
                            const isHead = node.id === headCommitId;
                            return (
                                <motion.g
                                    key={node.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={NODE_RADIUS}
                                        fill={isHead ? "var(--bg-secondary)" : "var(--bg-primary)"}
                                        stroke={isHead ? "var(--accent-primary)" : "var(--text-tertiary)"}
                                        strokeWidth={isHead ? 3 : 2}
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y + 4}
                                        textAnchor="middle"
                                        fill={isHead ? "var(--accent-primary)" : "var(--text-secondary)"}
                                        fontSize="10"
                                        style={{ fontFamily: 'monospace', pointerEvents: 'none', userSelect: 'none' }}
                                    >
                                        {node.id}
                                    </text>

                                    {/* Message Label */}
                                    <text
                                        x={node.x}
                                        y={node.y + NODE_RADIUS + 16}
                                        textAnchor="middle"
                                        fill="var(--text-secondary)"
                                        fontSize="10"
                                        style={{ whiteSpace: 'pre' }}
                                    >
                                        {node.message}
                                    </text>

                                    {/* HEAD Indicator Label */}
                                    {isHead && (
                                        <motion.text
                                            initial={{ y: -10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            x={node.x}
                                            y={node.y - NODE_RADIUS - 8}
                                            textAnchor="middle"
                                            fill="var(--accent-primary)"
                                            fontSize="11"
                                            fontWeight="bold"
                                        >
                                            HEAD
                                        </motion.text>
                                    )}
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </svg>
            </div>
        </div>
    );
};

export default GitGraphViz;
