import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDojo } from '../../context/DojoContext';
import './DojoChallenge.css';

interface DojoChallengeProps {
    onStartAndClose: () => void;
}

const DojoChallenge: React.FC<DojoChallengeProps> = ({ onStartAndClose }) => {
    const { t } = useTranslation('common');
    const { state, goToList } = useDojo();
    const { currentProblem } = state;

    if (!currentProblem) {
        return null;
    }

    const handleStart = () => {
        onStartAndClose();
    };

    const handleBack = () => {
        goToList();
    };

    // Get difficulty info
    const getDifficultyInfo = () => {
        const level = currentProblem.level || 'basic';
        const stars = currentProblem.stars || 2;

        const levelMap: Record<string, { label: string; color: string; gradient: string }> = {
            basic: { label: 'BASIC', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
            intermediate: { label: 'INTERMEDIATE', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            advanced: { label: 'ADVANCED', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
        };

        return {
            ...levelMap[level] || levelMap.basic,
            stars
        };
    };

    const difficulty = getDifficultyInfo();

    return (
        <div className="dojo-challenge-v2">
            {/* Header */}
            <div className="dc-header">
                <button className="dc-back-btn" onClick={handleBack}>
                    <span className="back-arrow">←</span>
                    <span>{t('dojo.backToList')}</span>
                </button>

                <div className="dc-meta">
                    <span className="dc-id">#{currentProblem.id}</span>
                    <span className="dc-difficulty" style={{ background: difficulty.gradient }}>
                        {difficulty.label}
                    </span>
                </div>
            </div>

            {/* Title Card */}
            <div className="dc-title-card">
                <div className="dc-stars">
                    {Array.from({ length: 3 }, (_, i) => (
                        <span
                            key={i}
                            className={`star ${i < difficulty.stars ? 'filled' : ''}`}
                        >
                            ★
                        </span>
                    ))}
                </div>
                <h1 className="dc-title">{t(currentProblem.title)}</h1>
                <div className="dc-time">
                    <span className="time-icon">⏱️</span>
                    <span>約 {currentProblem.estimatedMinutes || 5} 分</span>
                </div>
            </div>

            {/* Content */}
            <div className="dc-content">
                {/* Problem Section */}
                <div className="dc-section">
                    <div className="section-header">
                        <span className="section-icon">📋</span>
                        <span className="section-label">{t('dojo.problem')}</span>
                    </div>
                    <div className="section-body">
                        <p className="dc-description">{t(currentProblem.description)}</p>
                    </div>
                </div>

                {/* Goals Section */}
                <div className="dc-section">
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <span className="section-label">{t('dojo.goals')}</span>
                    </div>
                    <div className="section-body">
                        <ul className="dc-goals">
                            {currentProblem.goals.map((goal, idx) => (
                                <li key={idx} className="dc-goal-item">
                                    <span className="goal-check">○</span>
                                    <span className="goal-text">{t(goal)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            <div className="dc-footer">
                <button className="dc-start-btn" onClick={handleStart}>
                    <span className="btn-icon">🚀</span>
                    <span className="btn-text">{t('dojo.start')}</span>
                    <span className="btn-glow" />
                </button>
            </div>
        </div>
    );
};

export default DojoChallenge;
