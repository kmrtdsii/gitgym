import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDojo } from '../../context/DojoContext';
import './GitDojo.css';

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
        // Close the Dojo modal - mission is already active from startChallenge
        onStartAndClose();
    };

    const handleBack = () => {
        // Preview screen - go directly to list without confirmation
        goToList();
    };

    return (
        <div className="dojo-challenge">
            {/* Header - No timer in preview */}
            <div className="challenge-header">
                <button className="back-button" onClick={handleBack}>
                    ← {t('dojo.backToList')}
                </button>
                <div className="challenge-title-row">
                    <span className="challenge-id">CHALLENGE #{currentProblem.id}</span>
                    <h2 className="challenge-title">{t(currentProblem.title)}</h2>
                </div>
            </div>

            {/* Challenge Body - Preview shows problem + goals + Start */}
            <div className="challenge-body">
                {/* Problem Description */}
                <div className="challenge-section">
                    <h3 className="section-title">📋 {t('dojo.problem')}</h3>
                    <p className="problem-description">{t(currentProblem.description)}</p>
                </div>

                {/* Goals */}
                <div className="challenge-section">
                    <h3 className="section-title">🎯 {t('dojo.goals')}</h3>
                    <ul className="goals-list">
                        {currentProblem.goals.map((goal, idx) => (
                            <li key={idx} className="goal-item">
                                <span className="goal-checkbox">☐</span>
                                <span className="goal-text">{t(goal)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Start Button */}
                <div className="challenge-actions preview-actions">
                    <button
                        className="action-button primary start-button"
                        onClick={handleStart}
                    >
                        🚀 {t('dojo.start')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DojoChallenge;
