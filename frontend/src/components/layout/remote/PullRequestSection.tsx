import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../common/Modal';
import { Button } from '../../common/Button';
import type { PullRequest } from '../../../types/gitTypes';
import { sectionLabelStyle, actionButtonStyle, prCardStyle, mergeButtonStyle, emptyStyle } from './remoteStyles';

interface PullRequestSectionProps {
    pullRequests: PullRequest[];
    branches: Record<string, string>;
    onCreatePR: (title: string, desc: string, source: string, target: string) => void;
    onMergePR: (id: number) => Promise<void>;
    onDeletePR: (id: number) => Promise<void>;
}

/**
 * Pull Request section with list and creation UI.
 */
const PullRequestSection: React.FC<PullRequestSectionProps> = ({
    pullRequests,
    branches,
    onCreatePR,
    onMergePR,
    onDeletePR,
}) => {
    const { t } = useTranslation('common');
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [compareBase, setCompareBase] = useState('main');
    const [compareCompare, setCompareCompare] = useState('');

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeletingPR, setIsDeletingPR] = useState(false);

    // Set default compare branch when branches load or change
    useEffect(() => {
        const branchNames = Object.keys(branches);
        if (branchNames.length > 0) {
            // 1. Validate 'compareBase'
            let newBase = compareBase;
            if (!branchNames.includes(compareBase)) {
                // If current base is invalid (e.g. stale from other repo), reset to default
                if (branchNames.includes('main')) newBase = 'main';
                else if (branchNames.includes('master')) newBase = 'master';
                else newBase = branchNames[0];
                setCompareBase(newBase);
            }

            // 2. Validate 'compareCompare'
            // Must be valid AND different from base if possible
            if (!compareCompare || !branchNames.includes(compareCompare) || compareCompare === newBase) {
                // Try to find a different branch than newBase
                let candidate = branchNames.find(b => b !== newBase && b !== 'main' && b !== 'master');
                if (!candidate) {
                    candidate = branchNames.find(b => b !== newBase);
                }
                // If no other branch exists, just use the first available (even if same as base)
                if (!candidate) {
                    candidate = branchNames[0];
                }

                setCompareCompare(candidate);
            }
        }
    }, [branches, compareBase, compareCompare]);

    const handleCreatePRSubmit = (title: string) => {
        if (title) {
            onCreatePR(title, '', compareCompare, compareBase);
            setIsCompareMode(false);
        }
    };

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={sectionLabelStyle}>{t('remote.pullRequests')}</div>
                {!isCompareMode && (
                    <button
                        onClick={() => setIsCompareMode(true)}
                        style={{ ...actionButtonStyle, background: '#238636' }}
                    >
                        {t('remote.newPR')}
                    </button>
                )}
            </div>

            {isCompareMode ? (
                <CompareView
                    branches={branches}
                    compareBase={compareBase}
                    compareCompare={compareCompare}
                    onBaseChange={setCompareBase}
                    onCompareChange={setCompareCompare}
                    onSubmit={handleCreatePRSubmit}
                    onCancel={() => setIsCompareMode(false)}
                />
            ) : (
                <PullRequestList
                    pullRequests={pullRequests}
                    onMerge={onMergePR}
                    onDelete={(id) => {
                        setDeleteId(id);
                        setIsDeleteModalOpen(true);
                    }}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeletingPR && setIsDeleteModalOpen(false)}
                title={t('remote.list.delete')}
            >
                <div>
                    {t('remote.list.deleteConfirm')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <Button
                        variant="ghost"
                        onClick={() => setIsDeleteModalOpen(false)}
                        disabled={isDeletingPR}
                    >
                        {t('remote.cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={async () => {
                            if (deleteId) {
                                setIsDeletingPR(true);
                                await onDeletePR(deleteId);
                                setIsDeletingPR(false);
                                setIsDeleteModalOpen(false);
                                setDeleteId(null);
                            }
                        }}
                        isLoading={isDeletingPR}
                    >
                        {isDeletingPR ? t('remote.list.deleting') : t('remote.list.delete')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// --- Sub-components ---

interface CompareViewProps {
    branches: Record<string, string>;
    compareBase: string;
    compareCompare: string;
    onBaseChange: (value: string) => void;
    onCompareChange: (value: string) => void;
    onSubmit: (title: string) => void;
    onCancel: () => void;
}

const CompareView: React.FC<CompareViewProps> = ({
    branches,
    compareBase,
    compareCompare,
    onBaseChange,
    onCompareChange,
    onSubmit,
    onCancel,
}) => {
    const { t } = useTranslation('common');
    const branchNames = Object.keys(branches);
    const [title, setTitle] = useState(`Merge ${compareCompare} into ${compareBase}`);

    // Update default title when branches change
    useEffect(() => {
        setTitle(`Merge ${compareCompare} into ${compareBase}`);
    }, [compareBase, compareCompare]);

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)'
            }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px' }}>
                    {t('remote.compare.title')}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {t('remote.compare.desc')}
                </div>
            </div>

            <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <BranchSelector label={t('remote.compare.base')} value={compareBase} onChange={onBaseChange} branches={branchNames} />
                <span style={{ color: 'var(--text-tertiary)' }}>←</span>
                <BranchSelector label={t('remote.compare.compare')} value={compareCompare} onChange={onCompareChange} branches={branchNames} />
            </div>

            <div style={{
                padding: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)'
            }}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('remote.compare.titlePlaceholder')}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            <div style={{
                padding: '12px',
                background: '#e6ffec',
                color: '#1a7f37',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <span>✓</span>
                <strong>{t('remote.compare.ableToMerge')}</strong>
                <span>{t('remote.compare.ableToMergeDesc')}</span>
            </div>

            <div style={{ padding: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    {t('remote.cancel')}
                </button>
                <button
                    onClick={() => {
                        if (title.trim()) onSubmit(title);
                    }}
                    disabled={!title.trim()}
                    style={{
                        ...actionButtonStyle,
                        background: title.trim() ? '#238636' : 'var(--bg-button-disabled)',
                        fontSize: '0.9rem',
                        padding: '6px 16px',
                        opacity: title.trim() ? 1 : 0.6,
                        cursor: title.trim() ? 'pointer' : 'not-allowed'
                    }}
                >
                    {t('remote.compare.create')}
                </button>
            </div>
        </div>
    );
};

interface BranchSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    branches: string[];
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ label, value, onChange, branches }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 8px'
            }}
        >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
    </div>
);

interface PullRequestListProps {
    pullRequests: PullRequest[];
    onMerge: (id: number) => Promise<void>;
    onDelete: (id: number) => void;
}

const PullRequestList: React.FC<PullRequestListProps> = ({ pullRequests, onMerge, onDelete }) => {
    const { t } = useTranslation('common');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pullRequests.length === 0 ? (
                <div style={emptyStyle}>{t('remote.list.empty')}</div>
            ) : (
                pullRequests.map(pr => (
                    <PullRequestCard key={pr.id} pr={pr} onMerge={() => onMerge(pr.id)} onDelete={() => onDelete(pr.id)} />
                ))
            )}
        </div>
    );
};

interface PullRequestCardProps {
    pr: PullRequest;
    onMerge: () => Promise<void>;
    onDelete: () => void;
}

const PullRequestCard: React.FC<PullRequestCardProps> = ({ pr, onMerge, onDelete }) => {
    const { t } = useTranslation('common');
    const [isMerging, setIsMerging] = useState(false);
    // isDeleting removed, handled by parent Modal

    const handleMergeClick = async () => {
        setIsMerging(true);
        try {
            await onMerge();
        } catch (error) {
            console.error('Merge failed:', error);
            alert(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div style={prCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    #{pr.id} {pr.title}
                </div>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    background: pr.status === 'OPEN' ? '#238636' : '#8957e5',
                    color: 'white',
                    borderRadius: '10px'
                }}>
                    {pr.status}
                </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {pr.sourceBranch} ➜ {pr.targetBranch}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                {t('remote.list.openedBy', { name: pr.creator })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {pr.status === 'OPEN' && (
                    <button
                        onClick={handleMergeClick}
                        style={{
                            ...mergeButtonStyle,
                            flex: 1,
                            opacity: isMerging ? 0.6 : 1,
                            cursor: isMerging ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        disabled={isMerging}
                    >
                        {isMerging ? t('remote.list.merging') : t('remote.list.merge')}
                    </button>
                )}
                <button
                    onClick={() => onDelete()}
                    disabled={isMerging}
                    style={{
                        padding: '6px 12px',
                        background: '#d0d7de',
                        color: '#cf222e',
                        border: '1px solid #d0d7de',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    {t('remote.list.delete')}
                </button>
            </div>
        </div>
    );
};

export default PullRequestSection;
