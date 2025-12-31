import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGit } from '../../context/GitAPIContext';
import { gitService } from '../../services/gitService';
import './FileEditor.css';

interface FileEditorProps {
    filePath: string;
    onClose: () => void;
    onSave?: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({ filePath, onClose, onSave }) => {
    const { t } = useTranslation();
    const { sessionId, refreshState } = useGit();
    const [content, setContent] = useState<string>('');
    const [originalContent, setOriginalContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadFile = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await gitService.readFile(sessionId, filePath);
                setContent(result.content);
                setOriginalContent(result.content);
            } catch (err) {
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };
        loadFile();
    }, [sessionId, filePath]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await gitService.writeFile(sessionId, filePath, content);
            await refreshState();
            onSave?.();
            onClose();
        } catch (err) {
            setError(String(err));
        } finally {
            setSaving(false);
        }
    };

    // Sync scroll between textarea and line numbers
    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const fileName = filePath.split('/').pop() || filePath;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const lineCount = content.split('\n').length;
    const hasChanges = content !== originalContent;
    const hasConflict = content.includes('<<<<<<<') || content.includes('>>>>>>>');

    // Get file type icon
    const getFileIcon = () => {
        if (fileExt === 'md') return '📝';
        if (fileExt === 'json') return '📋';
        if (fileExt === 'js' || fileExt === 'ts') return '⚡';
        if (fileExt === 'css') return '🎨';
        if (fileExt === 'html') return '🌐';
        if (fileExt === 'go') return '🐹';
        if (fileExt === 'py') return '🐍';
        return '📄';
    };

    return (
        <div className="file-editor-overlay" onClick={onClose}>
            <div className="file-editor-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="file-editor-header">
                    <div className="file-editor-title">
                        <span className="file-icon">{getFileIcon()}</span>
                        <span className="file-name">{fileName}</span>
                        {hasChanges && <span className="unsaved-dot" title="未保存の変更" />}
                        {hasConflict && <span className="conflict-badge">⚠️ CONFLICT</span>}
                    </div>
                    <div className="file-editor-info">
                        <span className="line-count">{lineCount} lines</span>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Editor Body */}
                <div className="file-editor-body">
                    {loading ? (
                        <div className="editor-loading">
                            <div className="loading-spinner" />
                            <span>Loading...</span>
                        </div>
                    ) : error ? (
                        <div className="editor-error">
                            <span className="error-icon">❌</span>
                            <span>{error}</span>
                        </div>
                    ) : (
                        <div className="editor-container">
                            {/* Line Numbers */}
                            <div className="line-numbers" ref={lineNumbersRef}>
                                {Array.from({ length: lineCount }, (_, i) => (
                                    <div key={i} className="line-number">{i + 1}</div>
                                ))}
                            </div>

                            {/* Text Area */}
                            <textarea
                                ref={textareaRef}
                                className="editor-textarea"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onScroll={handleScroll}
                                spellCheck={false}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="file-editor-footer">
                    <div className="footer-left">
                        {hasConflict && (
                            <span className="conflict-hint">
                                💡 &lt;&lt;&lt;&lt;&lt;&lt;&lt; と &gt;&gt;&gt;&gt;&gt;&gt;&gt; の間を編集してコンフリクトを解決
                            </span>
                        )}
                    </div>
                    <div className="footer-actions">
                        <button
                            className="editor-btn save"
                            onClick={handleSave}
                            disabled={loading || saving || !hasChanges}
                        >
                            {saving ? (
                                <>
                                    <span className="btn-spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="save-icon">💾</span>
                                    {t('common.save', 'Save')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
