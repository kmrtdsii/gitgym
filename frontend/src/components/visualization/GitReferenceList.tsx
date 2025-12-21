
import React from 'react';
import { useGit } from '../../context/GitAPIContext';
import type { Commit } from '../../types/gitTypes';

interface GitReferenceListProps {
    type: 'branches' | 'tags';
    onSelect?: (commit: Commit) => void;
}

const GitReferenceList: React.FC<GitReferenceListProps> = ({ type, onSelect }) => {
    const { state } = useGit();
    const references = type === 'branches' ? state.branches : state.tags;
    const { commits } = state;

    // Create a map of Commit ID -> Commit Object for easy lookup
    const commitMap = new Map(commits.map(c => [c.id, c]));

    const listItems = Object.entries(references || {}).map(([name, commitId]) => {
        const commit = commitMap.get(commitId);
        return {
            name,
            commitId,
            commit
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (!listItems.length) {
        return (
            <div className="flex h-full items-center justify-center text-gray-500 font-mono text-sm">
                No {type} found.
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            overflow: 'auto',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: '12px'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '8px 16px', width: '150px' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '8px 16px', width: '80px' }}>Hash</th>
                        <th style={{ textAlign: 'left', padding: '8px 16px' }}>Message</th>
                        <th style={{ textAlign: 'right', padding: '8px 16px', width: '150px' }}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {listItems.map((item) => (
                        <tr
                            key={item.name}
                            onClick={() => item.commit && onSelect && onSelect(item.commit)}
                            style={{
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-subtle)',
                                ':hover': { backgroundColor: 'var(--bg-secondary)' }
                            } as any}
                            className="hover:bg-opacity-10 hover:bg-white"
                        >
                            <td style={{ padding: '8px 16px', fontWeight: 'bold', color: type === 'branches' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                {item.name}
                            </td>
                            <td style={{ padding: '8px 16px', color: 'var(--text-tertiary)' }}>
                                {item.commitId.substring(0, 7)}
                            </td>
                            <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                {item.commit?.message || '<unknown commit>'}
                            </td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                                {item.commit ? new Date(item.commit.timestamp).toLocaleString('ja-JP', {
                                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                }) : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GitReferenceList;
