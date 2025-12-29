import React, { useState } from 'react';
import type { CloneStatus } from './CloneProgress';
import { actionButtonStyle } from './remoteStyles';
import CreateRepoDialog from './CreateRepoDialog';
import ConnectRepoDialog from './ConnectRepoDialog';
import { Plus, Link2 } from 'lucide-react';

interface EmptyStateProps {
    isEditMode?: boolean;
    cloneStatus?: CloneStatus;
    onConnect?: () => void;
    recentRemotes?: string[];
    onSelectRemote?: (name: string) => void;
}

import { useTranslation } from 'react-i18next';

const EmptyState: React.FC<EmptyStateProps> = ({
    cloneStatus,
    recentRemotes = [],
    onSelectRemote
}) => {
    const { t } = useTranslation('common');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            gap: '12px',
            padding: '20px',
            textAlign: 'center'
        }}>
            {cloneStatus === 'idle' && (
                <>
                    <div style={{ fontSize: '24px', opacity: 0.3 }}>🌐</div>
                    <div style={{ fontSize: '0.85rem' }}>{t('remote.empty.title')}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px', marginTop: '10px' }}>
                        <button
                            onClick={() => setIsConnectDialogOpen(true)}
                            style={{
                                ...actionButtonStyle,
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '13px',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Link2 size={14} />
                            {t('remote.empty.connect')}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                            <span>{t('remote.empty.or')}</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                        </div>

                        <button
                            onClick={() => setIsCreateDialogOpen(true)}
                            style={{
                                ...actionButtonStyle,
                                background: 'var(--accent-primary)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '13px',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Plus size={14} />
                            {t('remote.empty.create')}
                        </button>
                    </div>

                    {/* Recent Repositories List */}
                    {recentRemotes.length > 0 && (
                        <div style={{ marginTop: '24px', width: '100%', maxWidth: '240px' }}>
                            <div style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                marginBottom: '8px',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>{t('remote.recent', { defaultValue: '履歴' })}</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {recentRemotes.map(remote => (
                                    <button
                                        key={remote}
                                        onClick={() => onSelectRemote?.(remote)}
                                        style={{
                                            ...actionButtonStyle,
                                            background: 'transparent',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid transparent',
                                            fontSize: '12px',
                                            padding: '6px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            justifyContent: 'flex-start'
                                        }}
                                        className="hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-subtle)]"
                                    >
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: remote === 'origin' ? 'var(--accent-primary)' : 'var(--text-tertiary)'
                                        }} />
                                        {remote}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {(cloneStatus === 'fetching_info' || cloneStatus === 'cloning') && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('remote.empty.connecting')}
                </div>
            )}

            <CreateRepoDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
            />
            <ConnectRepoDialog
                isOpen={isConnectDialogOpen}
                onClose={() => setIsConnectDialogOpen(false)}
            />
        </div>
    );
};

export default EmptyState;
