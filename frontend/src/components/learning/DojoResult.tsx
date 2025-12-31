import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDojo } from '../../context/DojoContext';
import './GitDojo.css';

const DojoResult: React.FC = () => {
    const { t } = useTranslation('common');
    const { state, goToList, nextProblem } = useDojo();
    const { currentProblem, lastResult } = state;

    if (!currentProblem || !lastResult) {
        return null;
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="dojo-result">
            {/* Result Header */}
            <motion.div
                className={`result-header ${lastResult.passed ? 'passed' : 'failed'}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
            >
                <div className="result-icon">
                    {lastResult.passed ? '🎉' : '😢'}
                </div>
                <h2 className="result-status">
                    {lastResult.passed ? t('dojo.result.passed') : t('dojo.result.failed')}
                </h2>
            </motion.div>

            {/* Stats */}
            <div className="result-stats">
                <div className="stat-item">
                    <span className="stat-label">📊 {t('dojo.result.score')}</span>
                    <span className="stat-value">{lastResult.score}{t('dojo.result.points')}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">⏱ {t('dojo.result.time')}</span>
                    <span className="stat-value">{formatTime(lastResult.timeMs)}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">💡 {t('dojo.result.hints')}</span>
                    <span className="stat-value">{lastResult.hintsUsed}{t('dojo.result.times')}</span>
                </div>
            </div>

            {/* Solution */}
            <div className="result-section">
                <h3 className="section-title">📖 {t('dojo.result.solution')}</h3>
                <div className="solution-code">
                    {currentProblem.solutionSteps.map((step, idx) => (
                        <div key={idx} className="code-line">
                            <span className="line-prefix">$</span>
                            <span className="line-content">{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trivia */}
            <div className="result-section trivia-section">
                <h3 className="section-title">💡 {t('dojo.result.trivia')}</h3>
                <p className="trivia-text">{t(currentProblem.trivia)}</p>
            </div>

            {/* Actions */}
            <div className="result-actions">
                <button className="action-button secondary" onClick={goToList}>
                    {t('dojo.result.backToList')}
                </button>
                {lastResult.passed && (
                    <button className="action-button primary" onClick={nextProblem}>
                        {t('dojo.result.next')} →
                    </button>
                )}
            </div>
        </div>
    );
};

export default DojoResult;
