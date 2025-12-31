import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGit } from '../../context/GitAPIContext';
import { Folder, FileCode, FilePlus, FolderPlus, GitBranch, ChevronRight, ChevronDown, MoreVertical, Pencil, Trash } from 'lucide-react';
import type { SelectedObject } from '../../types/layoutTypes';
import Modal from '../common/Modal';
import { Button } from '../common/Button';
import { FileEditor } from '../editor/FileEditor';

interface FileExplorerProps {
    onSelect: (obj: SelectedObject) => void;
}

interface TreeNode {
    name: string;
    path: string;
    isDir: boolean;
    children: Record<string, TreeNode>;
    status?: string;
    hasChanges?: boolean;
}

const buildTree = (files: string[], statuses: Record<string, string>): TreeNode => {
    const root: TreeNode = { name: 'root', path: '', isDir: true, children: {} };

    const computeChanges = (node: TreeNode): boolean => {
        let changed = false;
        if (!node.isDir && node.status && node.status.trim() !== '') {
            const status = node.status;
            if (status === '??') changed = true;
            else if (status.length > 1 && status[1] !== ' ' && status[1] !== '?') changed = true;
        }
        Object.values(node.children).forEach(child => {
            if (computeChanges(child)) changed = true;
        });
        node.hasChanges = changed;
        return changed;
    };

    files.forEach(filePath => {
        const isExplicitDir = filePath.endsWith('/');
        const cleanFilePath = isExplicitDir ? filePath.slice(0, -1) : filePath;
        const parts = cleanFilePath.split('/');
        let current = root;

        parts.forEach((part, index) => {
            if (!part) return;
            const currentPath = parts.slice(0, index + 1).join('/');
            if (!current.children[part]) {
                current.children[part] = { name: part, path: currentPath, isDir: false, children: {} };
            }
            if (index < parts.length - 1) {
                current.children[part].isDir = true;
                current = current.children[part];
            } else {
                current.children[part].status = statuses[filePath];
                if (isExplicitDir) current.children[part].isDir = true;
            }
        });
    });

    computeChanges(root);
    return root;
};

const TreeItem: React.FC<{
    node: TreeNode,
    depth: number,
    selectedItemPath: string | null,
    onFileClick?: (path: string) => void,
    onOpenFile?: (path: string) => void,
    onContextMenu?: (e: React.MouseEvent, path: string, isDir: boolean) => void,
    isRenaming?: boolean,
    onRenameComplete?: (newName: string) => void,
    onCancelRename?: () => void
}> = ({ node, depth, selectedItemPath, onFileClick, onOpenFile, onContextMenu, isRenaming, onRenameComplete, onCancelRename }) => {
    const isSelected = selectedItemPath === node.path;
    const [isOpen, setIsOpen] = useState(false);
    // editValue is used for the rename input field
    const [editValue, setEditValue] = useState(node.name);

    const hasChildren = Object.keys(node.children).length > 0;
    const isDir = node.isDir || hasChildren;

    const sortedChildren = useMemo(() => {
        return Object.values(node.children).sort((a, b) => {
            if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
            return a.isDir ? -1 : 1;
        });
    }, [node.children]);

    const status = node.status || '';
    const worktreeStatus = status.length > 1 ? status[1] : ' ';
    const isUntracked = status === '??';
    const isModified = worktreeStatus !== ' ' && worktreeStatus !== '?';
    const showDot = isDir && node.hasChanges;

    return (
        <div className="tree-item-container">
            <div
                className={`explorer-row ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isDir) setIsOpen(!isOpen);
                    onFileClick?.(node.path);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isDir) onOpenFile?.(node.path);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu?.(e, node.path, isDir);
                }}
            >
                <span className="expand-icon">
                    {isDir && (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
                </span>
                <span className="icon">
                    {isDir ?
                        <Folder size={14} style={{ color: showDot ? '#e2c08d' : 'var(--accent-primary)' }} fill={isOpen ? 'var(--accent-primary)' : 'none'} fillOpacity={0.2} /> :
                        <FileCode size={14} style={{ color: isUntracked ? '#73c990' : isModified ? '#e2c08d' : 'var(--text-tertiary)' }} />
                    }
                </span>

                {isRenaming ? (
                    <input
                        autoFocus
                        className="inline-rename-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => onRenameComplete?.(editValue)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameComplete?.(editValue);
                            if (e.key === 'Escape') onCancelRename?.();
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="name" style={{ color: isUntracked ? '#73c990' : isModified ? '#e2c08d' : 'inherit' }}>
                        {node.name}
                    </span>
                )}

                <div className="row-actions">
                    {!isRenaming && (
                        <>
                            {isModified && <span className="status-indicator modified">M</span>}
                            {isUntracked && <span className="status-indicator untracked">U</span>}
                            <div className="hover-btns">
                                <button onClick={(e) => { e.stopPropagation(); onContextMenu?.(e as unknown as React.MouseEvent, node.path, isDir); }} className="hover-action-btn">
                                    <MoreVertical size={12} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isOpen && isDir && (
                <div className="tree-children">
                    {sortedChildren.map(child => (
                        <TreeItem
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            selectedItemPath={selectedItemPath}
                            onFileClick={onFileClick}
                            onOpenFile={onOpenFile}
                            onContextMenu={onContextMenu}
                            isRenaming={isRenaming}
                            onRenameComplete={onRenameComplete}
                            onCancelRename={onCancelRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer: React.FC<FileExplorerProps> = () => {
    const { t } = useTranslation('common');
    const { state, runCommand, sessionId, fetchWorkspaceTree } = useGit();

    const [selectedItemPath, setSelectedItemPath] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
    const [newName, setNewName] = useState('');
    const createInputRef = useRef<HTMLInputElement>(null);

    // Modern UI State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, isDir: boolean } | null>(null);
    const [renamingPath, setRenamingPath] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ path: string, isDir: boolean } | null>(null);

    useEffect(() => {
        if (sessionId) fetchWorkspaceTree(sessionId);
    }, [fetchWorkspaceTree, sessionId, state.commandCount]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Close menu if clicking outside it
            const target = e.target as HTMLElement;
            if (!target.closest('.custom-context-menu')) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    const activeProject = state.activeProject || null;
    const files = state.files || [];
    const fileStatuses = state.fileStatuses || {};
    const projects = state.projects || [];
    const projectMetadata = state.projectMetadata || {};

    const handleNavigate = async (path: string) => {
        await runCommand(`cd ${path}`, { silent: true });
        if (sessionId) await fetchWorkspaceTree(sessionId);
    };

    const handleCreate = async () => {
        const trimmedName = newName.trim();
        if (!trimmedName) {
            setCreatingType(null);
            return;
        }
        if (creatingType === 'file') await runCommand(`touch ${trimmedName}`);
        else if (creatingType === 'folder') await runCommand(`mkdir -p ${trimmedName}`);
        setCreatingType(null);
        setNewName('');
        if (sessionId) await fetchWorkspaceTree(sessionId);
    };

    const handleContextMenu = (e: React.MouseEvent, path: string, isDir: boolean) => {
        setContextMenu({ x: e.clientX, y: e.clientY, path, isDir });
    };

    const handleRenameComplete = async (newName: string) => {
        const oldPath = renamingPath;
        if (!oldPath) return;
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldPath.split('/').pop()) {
            setRenamingPath(null);
            return;
        }
        const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
        const newPath = parentDir ? `${parentDir}/${trimmed}` : trimmed;
        await runCommand(`mv ${oldPath} ${newPath}`);
        setRenamingPath(null);
        if (sessionId) fetchWorkspaceTree(sessionId);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await runCommand(`rm -rf ${itemToDelete.path}`);
        if (selectedItemPath === itemToDelete.path) setSelectedItemPath(null);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        if (sessionId) fetchWorkspaceTree(sessionId);
    };

    return (
        <div className="file-explorer-container">
            {/* PANE 1: WORKSPACE */}
            <div className="workspace-pane">
                <div className="pane-header">{t('workspace.title').toUpperCase()}</div>
                <div className="pane-content">
                    {projects.map(proj => {
                        const isSelected = activeProject === proj;
                        const branch = projectMetadata[proj]?.branch;
                        return (
                            <div key={proj} className={`project-row ${isSelected ? 'active' : ''}`} onClick={() => handleNavigate(`/${proj}`)}>
                                <GitBranch size={14} />
                                <div className="project-info">
                                    <span className="project-name">{proj}</span>
                                    {branch && <span className="project-branch">{branch}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PANE 2: WORKING TREE */}
            <div className="working-tree-pane">
                <div className="pane-header">
                    <div className="title-area">
                        <span>{t('workspace.files').toUpperCase()}</span>
                        {activeProject && <span className="active-project-badge">{activeProject.toUpperCase()}</span>}
                    </div>
                    <div className="header-actions">
                        <button onClick={() => setCreatingType('file')} title="New File"><FilePlus size={14} /></button>
                        <button onClick={() => setCreatingType('folder')} title="New Folder"><FolderPlus size={14} /></button>
                    </div>
                </div>

                <div className="pane-content">
                    {creatingType && (
                        <div className="creation-row">
                            {creatingType === 'file' ? <FileCode size={14} /> : <Folder size={14} />}
                            <input
                                ref={createInputRef}
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setCreatingType(null);
                                }}
                                onBlur={() => !newName.trim() && setCreatingType(null)}
                                placeholder={creatingType === 'file' ? 'filename' : 'folder'}
                            />
                        </div>
                    )}

                    {files.length === 0 ? (
                        <div className="no-files">{t('workspace.noFiles')}</div>
                    ) : (
                        <div className="tree-root">
                            {(() => {
                                const root = buildTree(files, fileStatuses);
                                return Object.values(root.children)
                                    .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))
                                    .map(child => (
                                        <TreeItem
                                            key={child.path}
                                            node={child}
                                            depth={0}
                                            selectedItemPath={selectedItemPath}
                                            onFileClick={setSelectedItemPath}
                                            onOpenFile={setEditingFile}
                                            onContextMenu={handleContextMenu}
                                            isRenaming={renamingPath === child.path}
                                            onRenameComplete={handleRenameComplete}
                                            onCancelRename={() => setRenamingPath(null)}
                                        />
                                    ));
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Context Menu */}
            {contextMenu && (
                <div
                    className="custom-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="menu-item" onClick={() => { setRenamingPath(contextMenu.path); setContextMenu(null); }}>
                        <Pencil size={12} /> {t('common.rename', '名前を変更')}
                    </div>
                    <div className="menu-item danger" onClick={() => { setItemToDelete({ path: contextMenu.path, isDir: contextMenu.isDir }); setIsDeleteModalOpen(true); setContextMenu(null); }}>
                        <Trash size={12} /> {t('common.delete', '削除')}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('workspace.deleteTitle')}>
                <div style={{ padding: '20px' }}>
                    <p>{t('workspace.deleteConfirm', { name: itemToDelete?.path.split('/').pop() })}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                        <Button variant="danger" onClick={handleDelete}>{t('common.delete', 'Delete')}</Button>
                    </div>
                </div>
            </Modal>

            {/* File Editor overlay */}
            {editingFile && (
                <FileEditor
                    filePath={editingFile}
                    onClose={() => setEditingFile(null)}
                    onSave={() => sessionId && fetchWorkspaceTree(sessionId)}
                    onRename={(_old, newP) => {
                        setEditingFile(newP);
                        if (sessionId) fetchWorkspaceTree(sessionId);
                    }}
                />
            )}

            <style>{`
                .file-explorer-container { display: flex; width: 100%; height: 100%; background: var(--bg-primary); color: var(--text-primary); }
                .workspace-pane { width: 240px; border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; }
                .working-tree-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                .pane-header { height: 40px; display: flex; align-items: center; padding: 0 12px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.05em; justify-content: space-between; flex-shrink: 0; }
                .pane-content { flex: 1; overflow-y: auto; padding: 8px 0; }
                .title-area { display: flex; align-items: center; gap: 8px; overflow: hidden; }
                .project-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; color: var(--text-secondary); }
                .project-row:hover { background: var(--bg-tertiary); }
                .project-row.active { background: rgba(var(--accent-primary-rgb), 0.15); border-left-color: var(--accent-primary); color: var(--text-primary); }
                .project-row.active .project-name { font-weight: 700; color: var(--accent-primary); }
                .project-row.active svg { color: var(--accent-primary); }
                .project-info { display: flex; flex-direction: column; min-width: 0; }
                .project-name { font-size: 13px; font-weight: 500; transition: all 0.2s; }
                .project-branch { font-size: 11px; color: var(--accent-primary); opacity: 0.8; }
                .active-project-badge { margin-left: 8px; background: rgba(var(--accent-primary-rgb), 0.15); color: var(--accent-primary); padding: 1px 6px; border-radius: 4px; font-size: 10px; }
                .header-actions { display: flex; gap: 4px; }
                .header-actions button { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
                .header-actions button:hover { background: var(--bg-tertiary); color: var(--text-primary); }
                .explorer-row { display: flex; align-items: center; padding: 4px 12px; cursor: pointer; border-radius: 0; position: relative; transition: background 0.15s; height: 28px; }
                .explorer-row:hover { background: var(--bg-tertiary); }
                .explorer-row.selected { background: rgba(var(--accent-primary-rgb), 0.15) !important; color: var(--text-primary); }
                .explorer-row.selected::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent-primary); }
                .expand-icon { width: 16px; display: flex; justify-content: center; }
                .icon { margin-right: 6px; display: flex; align-items: center; }
                .name { font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .row-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; height: 100%; }
                .status-indicator { font-size: 10px; font-weight: 700; width: 14px; text-align: center; }
                .status-indicator.modified { color: #e2c08d; }
                .status-indicator.untracked { color: #73c990; }
                .hover-btns { display: none; }
                .explorer-row:hover .hover-btns { display: flex; }
                .hover-action-btn { background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: 4px; border-radius: 4px; }
                .hover-action-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
                .inline-rename-input { background: var(--bg-tertiary); border: 1px solid var(--accent-primary); color: var(--text-primary); font-size: 12px; padding: 1px 4px; width: 100%; outline: none; border-radius: 2px; }
                .custom-context-menu { position: fixed; background: var(--bg-secondary); backdrop-filter: blur(12px); border: 1px solid var(--border-subtle); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); padding: 4px; z-index: 2000; min-width: 160px; animation: scaleIn 0.1s ease-out; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .menu-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-size: 12px; cursor: pointer; border-radius: 4px; transition: all 0.2s; color: var(--text-secondary); }
                .menu-item:hover { background: var(--accent-primary); color: white; }
                .menu-item.danger { color: var(--color-error); }
                .menu-item.danger:hover { background: var(--color-error); color: white; }
                .no-files { padding: 20px; color: var(--text-tertiary); font-style: italic; text-align: center; font-size: 12px; }
                .creation-row { display: flex; align-items: center; gap: 8px; padding: 4px 12px; background: rgba(var(--accent-primary-rgb), 0.1); border-bottom: 1px solid var(--border-subtle); }
                .creation-row input { background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 12px; flex: 1; }
                .tree-root { padding-bottom: 20px; }
            `}</style>
        </div>
    );
};

export default FileExplorer;
