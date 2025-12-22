import React from 'react';
import { useGit } from '../../context/GitAPIContext';

const RemoteRepoView: React.FC = () => {
    const { state } = useGit();
    const { remotes, remoteBranches, tags } = state;

    // Filter tags to show only those that might be considered "remote" 
    // (in this simple simulation, all tags are global, but we can list them here)

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>Remote Repository</div>

            <div style={sectionStyle}>
                <div style={sectionLabelStyle}>REMOTES</div>
                {remotes && remotes.length > 0 ? (
                    remotes.map((remote, idx) => (
                        <div key={idx} style={cardStyle}>
                            <div style={remoteNameStyle}>{remote.name}</div>
                            {remote.urls.map((url, uidx) => (
                                <div key={uidx} style={urlStyle}>{url}</div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div style={emptyStyle}>No remotes configured</div>
                )}
            </div>

            <div style={sectionStyle}>
                <div style={sectionLabelStyle}>REMOTE BRANCHES</div>
                {Object.keys(remoteBranches).length > 0 ? (
                    <div style={listStyle}>
                        {Object.entries(remoteBranches).map(([name, hash]) => (
                            <div key={name} style={listItemStyle}>
                                <span style={branchIconStyle}></span>
                                <span style={branchNameStyle}>{name}</span>
                                <span style={hashStyle}>{hash.substring(0, 7)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={emptyStyle}>No remote branches found</div>
                )}
            </div>

            <div style={sectionStyle}>
                <div style={sectionLabelStyle}>TAGS</div>
                {Object.keys(tags).length > 0 ? (
                    <div style={listStyle}>
                        {Object.entries(tags).map(([name, hash]) => (
                            <div key={name} style={listItemStyle}>
                                <span style={tagIconStyle}>🏷</span>
                                <span style={tagNameStyle}>{name}</span>
                                <span style={hashStyle}>{hash.substring(0, 7)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={emptyStyle}>No tags found</div>
                )}
            </div>

            <div style={hintStyle}>
                <span style={{ fontSize: '18px' }}>☁️</span>
                <p>This view represents the server-side state. Use <code>git push</code> or <code>git fetch</code> to sync changes.</p>
            </div>
        </div>
    );
};

// Styles
const containerStyle: React.CSSProperties = {
    padding: '16px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    background: 'var(--bg-primary)',
};

const headerStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '8px'
};

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
};

const cardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const remoteNameStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    marginBottom: '4px'
};

const urlStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    opacity: 0.8
};

const emptyStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    padding: '8px 16px',
    border: '1px dashed var(--border-subtle)',
    borderRadius: '8px'
};

const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
};

const listItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    fontSize: '0.85rem'
};

const branchIconStyle: React.CSSProperties = {
    color: 'var(--accent-primary)',
    fontSize: '1.1rem'
};

const branchNameStyle: React.CSSProperties = {
    flex: 1,
    color: 'var(--text-secondary)',
    fontWeight: 500
};

const tagIconStyle: React.CSSProperties = {
    color: '#ff7b72',
    fontSize: '0.9rem'
};

const tagNameStyle: React.CSSProperties = {
    flex: 1,
    color: 'var(--text-secondary)',
    fontWeight: 500
};

const hashStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 6px',
    borderRadius: '4px'
};

const hintStyle: React.CSSProperties = {
    marginTop: 'auto',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    border: '1px solid rgba(59, 130, 246, 0.2)'
};

export default RemoteRepoView;
