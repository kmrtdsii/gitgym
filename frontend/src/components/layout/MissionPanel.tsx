import React, { useEffect, useState, useCallback } from 'react';
import { useMission, type VerificationResult } from '../../context/MissionContext';
import { useDojo } from '../../context/DojoContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './MissionPanel.css';

interface MissionInfo {
    id: string;
    title: string;
    description: string;
    hints: string[];
    difficulty?: {
        level: string;
        stars: number;
    };
    skill?: string;
}

interface MissionStep {
    id: string;
    description: string;
    completed: boolean;
}

const MissionPanel: React.FC = () => {
    const { activeMissionId, endMission, verifyMission } = useMission();
    const { showResult, openDojoModal } = useDojo();
    const { t, i18n } = useTranslation();
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [missionInfo, setMissionInfo] = useState<MissionInfo | null>(null);
    const [revealedHints, setRevealedHints] = useState<number>(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    // Mock steps based on mission validation checks
    const [steps, setSteps] = useState<MissionStep[]>([]);

    // Timer effect - update every second
    useEffect(() => {
        if (!activeMissionId || showSuccess) return;

        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeMissionId, startTime, showSuccess]);

    useEffect(() => {
        if (activeMissionId) {
            setRevealedHints(0);
            setVerificationResult(null);
            setShowSuccess(false);
            setStartTime(Date.now());
            setElapsedTime(0);

            // Fetch mission details
            fetch('/api/mission/list', {
                headers: { 'Accept-Language': i18n.language }
            })
                .then(res => res.json())
                .then((missions: MissionInfo[]) => {
                    const mission = missions.find(m => m.id === activeMissionId);
                    if (mission) {
                        setMissionInfo(mission);
                        // Initialize steps based on typical merge conflict mission
                        if (mission.id === '001-conflict-crisis') {
                            setSteps([
                                { id: 'identify', description: t('mission.steps.identifyConflict'), completed: false },
                                { id: 'resolve', description: t('mission.steps.resolveConflict'), completed: false },
                                { id: 'commit', description: t('mission.steps.createMergeCommit'), completed: false },
                            ]);
                        }
                    }
                })
                .catch(console.error);
        } else {
            setMissionInfo(null);
            setVerificationResult(null);
            setSteps([]);
        }
    }, [activeMissionId, i18n.language, t]);

    const calculateScore = useCallback(() => {
        const baseScore = 100;
        const hintPenalty = revealedHints * 10;
        const timeBonus = Math.max(0, 20 - Math.floor(elapsedTime / 60000) * 5);
        return Math.max(0, baseScore - hintPenalty + timeBonus);
    }, [revealedHints, elapsedTime]);

    const handleVerify = useCallback(async () => {
        const result = await verifyMission();
        if (result) {
            setVerificationResult(result);

            // Update steps based on verification result
            if (result.progress) {
                setSteps(prev => prev.map((step, index) => ({
                    ...step,
                    completed: result.progress[index]?.passed ?? false
                })));
            }

            if (result.success) {
                // Capture missionId before endMission clears it
                const missionId = activeMissionId || '';

                // Save to localStorage for Skill Radar
                const masteredSkills = JSON.parse(localStorage.getItem('gitgym-mastered') || '[]');
                if (!masteredSkills.includes(missionInfo?.skill)) {
                    masteredSkills.push(missionInfo?.skill);
                    localStorage.setItem('gitgym-mastered', JSON.stringify(masteredSkills));
                }

                // Go directly to DojoResult screen (skip MissionPanel success overlay)
                const dojoResult = {
                    passed: true,
                    score: calculateScore(),
                    timeMs: elapsedTime,
                    hintsUsed: revealedHints,
                };
                showResult(dojoResult, missionId);
                endMission();
                // Delay modal open to allow state update to complete
                setTimeout(() => {
                    openDojoModal();
                }, 50);
            }
        }
    }, [verifyMission, missionInfo?.skill, activeMissionId, calculateScore, elapsedTime, revealedHints, showResult, endMission, openDojoModal]);

    const revealNextHint = () => {
        if (missionInfo && revealedHints < missionInfo.hints.length) {
            setRevealedHints(prev => prev + 1);
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!activeMissionId) return null;

    // Success Overlay
    if (showSuccess) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mission-success-overlay"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="mission-success-card"
                    >
                        <div className="success-confetti">🎉🎉🎉</div>
                        <h2 className="success-title">{t('mission.accomplished')}</h2>

                        <div className="success-skill-badge">
                            <span>⭐ {missionInfo?.skill} {t('mission.mastered')}</span>
                        </div>

                        <div className="success-stats">
                            <div className="stat-item">
                                <span className="stat-label">📊 {t('mission.score')}</span>
                                <span className="stat-value">{calculateScore()}{t('mission.points')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">⏱️ {t('mission.clearTime')}</span>
                                <span className="stat-value">{formatTime(Date.now() - startTime)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">💡 {t('mission.hintsUsed')}</span>
                                <span className="stat-value">{revealedHints}{t('mission.times')}</span>
                            </div>
                        </div>

                        <div className="success-actions">
                            <button
                                className="mission-button secondary"
                                onClick={() => {
                                    // Capture missionId before endMission clears it
                                    const missionId = activeMissionId || '';
                                    // Create result data and show in Dojo result screen
                                    const result = {
                                        passed: true,
                                        score: calculateScore(),
                                        timeMs: elapsedTime,
                                        hintsUsed: revealedHints,
                                    };
                                    setShowSuccess(false);
                                    showResult(result, missionId);
                                    endMission();
                                    // Delay modal open to allow state update to complete
                                    setTimeout(() => {
                                        openDojoModal();
                                    }, 50);
                                }}
                            >
                                {t('mission.returnToRadar')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                drag
                dragConstraints={{ left: -500, right: 0, top: -100, bottom: 300 }}
                dragElastic={0.1}
                dragMomentum={false}
                className="mission-panel redesigned"
            >
                {/* Blue Gradient Header */}
                <div className="mission-header-redesigned" style={{ cursor: 'grab' }}>
                    <div className="header-center">
                        <span className="challenge-number">CHALLENGE #{missionInfo?.id?.split('-')[0] || '101'}</span>
                        <h3 className="mission-title-main">
                            {missionInfo?.title || t('mission.loading')}
                        </h3>
                    </div>
                    <div className="timer-display">
                        ⏱ {formatTime(elapsedTime)}
                    </div>
                </div>

                {/* Objective */}
                <div className="mission-section">
                    <h4 className="section-title">📋 {t('mission.objective')}</h4>
                    <p className="mission-description">
                        {missionInfo?.description || t('mission.loading')}
                    </p>
                </div>

                {/* Steps Progress */}
                {steps.length > 0 && (
                    <div className="mission-section">
                        <h4 className="section-title">✅ {t('mission.steps.title')}</h4>
                        <ul className="mission-steps">
                            {steps.map((step) => (
                                <li key={step.id} className={`step-item ${step.completed ? 'completed' : ''}`}>
                                    <span className="step-checkbox">
                                        {step.completed ? '☑' : '☐'}
                                    </span>
                                    <span className="step-text">{step.description}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Hints Section */}
                {missionInfo?.hints && missionInfo.hints.length > 0 && (
                    <div className="mission-section hints-section">
                        <h4 className="section-title">
                            💡 {t('mission.hints.title')} ({revealedHints}/{missionInfo.hints.length})
                        </h4>

                        {revealedHints > 0 && (
                            <div className="hints-list">
                                {missionInfo.hints.slice(0, revealedHints).map((hint, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="hint-item"
                                    >
                                        <span className="hint-number">{index + 1}.</span>
                                        <span className="hint-text">{hint}</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {revealedHints < missionInfo.hints.length && (
                            <button
                                onClick={revealNextHint}
                                className="reveal-hint-btn"
                            >
                                {t('mission.hints.reveal')} ({missionInfo.hints.length - revealedHints} {t('mission.hints.remaining')})
                            </button>
                        )}
                    </div>
                )}

                {/* Verification Result */}
                {verificationResult && !verificationResult.success && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="verification-result failed"
                    >
                        <strong>❌ {t('mission.failed')}:</strong>
                        <ul className="failed-checks">
                            {verificationResult.progress.filter(p => !p.passed).map((p, i) => (
                                <li key={i}>{p.description}</li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <div className="mission-actions">
                    <button
                        onClick={handleVerify}
                        className="mission-button primary"
                    >
                        {t('mission.verify')}
                    </button>
                    <button
                        onClick={endMission}
                        className="mission-button secondary"
                    >
                        {t('mission.abort')}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MissionPanel;
