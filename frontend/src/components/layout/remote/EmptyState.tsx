import React, { useState } from 'react';
import type { CloneStatus } from './CloneProgress';
import { actionButtonStyle } from './remoteStyles';
import CreateRepoDialog from './CreateRepoDialog';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
    isEditMode: boolean;
    cloneStatus?: CloneStatus;
    onConnect: () => void;
}

import { useTranslation } from 'react-i18next';

const EmptyState: React.FC<EmptyStateProps> = ({ isEditMode, cloneStatus, onConnect }) => {
    const { t } = useTranslation('common');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // If cloning/creating is in progress (visible in parent), maybe hide buttons?
    // But parent handles "Connecting..." status via cloneStatus prop.
    // If Creating happens inside Dialog, cloneStatus might be updated there if logic is shared?
    // No, CreateRepoDialog uses its own useRemoteClone instance. 
    // The parent's RemoteRepoView uses another instance. 
    // This separation is OK because successful create will fetch state globally, updating parent.

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
            {!isEditMode && cloneStatus === 'idle' && (
                <>
                    <div style={{ fontSize: '24px', opacity: 0.3 }}>🌐</div>
                    <div style={{ fontSize: '0.85rem' }}>{t('remote.empty.title')}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px', marginTop: '10px' }}>
                        <button
                            onClick={onConnect}
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
                            {t('remote.empty.connect')}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                            <span>{t('common.or')}</span>
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
        </div>
    );
};

export default EmptyState;
