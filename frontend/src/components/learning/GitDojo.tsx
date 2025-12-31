import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDojo } from '../../context/DojoContext';
import { DOJO_PROBLEMS, isLocked, type DojoProblem, type DojoCategory } from '../../data/dojoProblems';
import { Modal } from '../common';
import DojoChallenge from './DojoChallenge';
import DojoResult from './DojoResult';
import './GitDojo.css';

interface GitDojoProps {
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
}

const GitDojo: React.FC<GitDojoProps> = ({ isOpen, onClose, onOpen }) => {
    const { t } = useTranslation('common');
    const { state, startChallenge, isCompleted, setOpenModalCallback } = useDojo();

    // Register the modal open callback
    React.useEffect(() => {
        setOpenModalCallback(onOpen);
    }, [setOpenModalCallback, onOpen]);

    const categories: { key: DojoCategory; icon: string; label: string }[] = [
        { key: 'basic', icon: '📦', label: t('dojo.category.basic') },
        { key: 'intermediate', icon: '🚀', label: t('dojo.category.intermediate') },
        { key: 'advanced', icon: '⚡', label: t('dojo.category.advanced') },
    ];

    const completedCount = state.completedProblemIds.length;
    const totalCount = DOJO_PROBLEMS.length;

    const getDifficultyStars = (difficulty: number) => {
        return '⭐'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
    };

    const handleStartProblem = (problem: DojoProblem) => {
        if (!isLocked(problem, state.completedProblemIds)) {
            startChallenge(problem.id);
        }
    };

    // Render based on phase
    const renderContent = () => {
        switch (state.phase) {
            case 'challenge':
                return <DojoChallenge onStartAndClose={onClose} />;
            case 'result':
                return <DojoResult />;
            default:
                return renderProblemList();
        }
    };

    const renderProblemList = () => (
        <div className="dojo-list">
            <div className="dojo-header">
                <h2 className="dojo-title">
                    <span className="dojo-icon">🥋</span>
                    {t('dojo.title')}
                </h2>
                <p className="dojo-subtitle">{t('dojo.subtitle')}</p>
            </div>

            <div className="dojo-categories">
                {categories.map(cat => {
                    const problems = DOJO_PROBLEMS.filter(p => p.category === cat.key);
                    if (problems.length === 0) return null;

                    return (
                        <div key={cat.key} className="dojo-category">
                            <div className="category-header">
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-label">{cat.label}</span>
                            </div>

                            <div className="problem-list">
                                {problems.map(problem => {
                                    const locked = isLocked(problem, state.completedProblemIds);
                                    const completed = isCompleted(problem.id);

                                    return (
                                        <motion.button
                                            key={problem.id}
                                            className={`problem-card ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
                                            onClick={() => handleStartProblem(problem)}
                                            disabled={locked}
                                            whileHover={locked ? {} : { scale: 1.02 }}
                                            whileTap={locked ? {} : { scale: 0.98 }}
                                        >
                                            <div className="problem-status">
                                                {locked ? '🔒' : completed ? '✅' : '○'}
                                            </div>
                                            <div className="problem-info">
                                                <span className="problem-id">#{problem.id}</span>
                                                <span className="problem-title">{t(problem.title)}</span>
                                            </div>
                                            <div className="problem-meta">
                                                <span className="problem-difficulty">
                                                    {getDifficultyStars(problem.difficulty)}
                                                </span>
                                                <span className="problem-time">
                                                    ~{problem.estimatedMinutes}{t('dojo.minutes')}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dojo-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>
                <span className="progress-text">
                    📊 {t('dojo.progress')}: {completedCount}/{totalCount} {t('dojo.cleared')}
                </span>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="fullscreen"
            hideCloseButton
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={state.phase}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="dojo-content"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </Modal>
    );
};

export default GitDojo;
