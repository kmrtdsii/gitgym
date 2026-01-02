import React, { useState } from 'react';
import './AppLayout.css';
import { useGit } from '../../context/GitAPIContext';
import { useTranslation } from 'react-i18next';

import GitGraphViz from '../visualization/GitGraphViz';

import RemoteRepoView from './RemoteRepoView';
import DeveloperTabs from './DeveloperTabs';
import BottomPanel from './BottomPanel';
import { Resizer } from '../common';
import AddDeveloperModal from './AddDeveloperModal';
import MissionPanel from './MissionPanel';
import { Sun, Moon, GitBranch, Tag, Search } from 'lucide-react';

import type { SelectedObject } from '../../types/layoutTypes';
import { useTheme } from '../../context/ThemeContext';
import { useResizablePanes } from '../../hooks/useResizablePanes';
import { motion, AnimatePresence } from 'framer-motion';

import CommitDetails from '../visualization/CommitDetails';
import SearchNavigator from './SearchNavigator';
import SkillRadar from '../visualization/SkillRadar';
import GitDojo from '../learning/GitDojo';
import { useDojo } from '../../context/DojoContext';

type SearchFocus = 'commit' | 'branch' | 'tag';

const AppLayout = () => {
    const { t } = useTranslation('common'); // Hook

    const {
        state, showAllCommits, toggleShowAllCommits,
        developers, activeDeveloper, switchDeveloper, addDeveloper, removeDeveloper
    } = useGit();

    const { theme, toggleTheme } = useTheme();

    const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
    const [detailsPaneWidth, setDetailsPaneWidth] = useState(300);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [searchFocus, setSearchFocus] = useState<SearchFocus>('commit');

    // --- Layout State (Refactored) ---
    const {
        leftPaneWidth,
        vizHeight,
        remoteGraphHeight,
        containerRef,
        centerContentRef,
        stackContainerRef,
        leftContentRef,
        startResizeLeft,
        startResizeCenterVert,
        startResizeLeftVert
    } = useResizablePanes();

    // Modal State
    const [isAddDevModalOpen, setIsAddDevModalOpen] = useState(false);
    const [isSkillRadarOpen, setIsSkillRadarOpen] = useState(false);
    const [isDojoOpen, setIsDojoOpen] = useState(false);

    const { goToList } = useDojo();

    const handleObjectSelect = (obj: SelectedObject) => {
        setSelectedObject(obj);
    };

    // Helper to toggle search with specific focus
    const toggleSearchMode = (focus: SearchFocus) => {
        if (isSearchOpen && searchFocus === focus) {
            setSearchOpen(false);
        } else {
            setSearchFocus(focus);
            setSearchOpen(true);
            setSearchQuery(''); // Clear query when switching mode
        }
    };

    // Auto-close details when repo is closed/unloaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        if (state.HEAD && state.HEAD.type === 'none') {
            setSelectedObject(null);
        }
    }, [state.HEAD?.type]);

    const startResizeDetails = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = detailsPaneWidth;

        const handleMouseMove = (mm: MouseEvent) => {
            const delta = startX - mm.clientX; // Dragging left increases width (since it's a right pane)
            setDetailsPaneWidth(Math.max(200, Math.min(800, startWidth + delta)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="layout-container" ref={containerRef} style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

            {/* --- COLUMN 1: REMOTE SERVER --- */}
            <aside
                className="left-pane"
                style={{ width: `${leftPaneWidth}% `, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}
                ref={leftContentRef}
                data-testid="layout-left-pane"
            >
                <div className="pane-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <RemoteRepoView
                        topHeight={remoteGraphHeight}
                        onResizeStart={startResizeLeftVert}
                    />
                </div>
            </aside>

            {/* Main Resizer (Left vs Local) */}
            <Resizer orientation="vertical" onMouseDown={startResizeLeft} />

            {/* --- COLUMN 2: LOCAL WORKSPACE (Merged Center & Right) --- */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }} data-testid="layout-workspace-pane">

                {/* ROW 1: User Tabs (Alice / Bob) + Integrated Utilities */}
                <DeveloperTabs
                    developers={developers}
                    activeDeveloper={activeDeveloper}
                    onSwitchDeveloper={switchDeveloper}
                    onAddDeveloper={() => setIsAddDevModalOpen(true)}
                    onRemoveDeveloper={removeDeveloper}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', alignSelf: 'center' }}>

                        {/* Search Bar (Integrated) */}
                        <AnimatePresence>
                            {isSearchOpen && (
                                <SearchNavigator
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchFocus={searchFocus}
                                    onSelectCommit={(commit) => handleObjectSelect({ type: 'commit', id: commit.id, data: commit })}
                                    branches={state.branches}
                                    tags={state.tags}
                                    commits={state.commits}
                                    remoteBranches={state.remoteBranches}
                                />
                            )}
                        </AnimatePresence>

                        {/* Git Dojo Button */}
                        <button
                            onClick={() => {
                                goToList();
                                setIsDojoOpen(true);
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                            }}
                            title="Git Dojo"
                        >
                            <span>🥋 {t('app.dojo')}</span>
                        </button>

                        {/* Skill Radar Button */}
                        <button
                            onClick={() => setIsSkillRadarOpen(true)}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--text-tertiary)',
                                color: 'var(--text-tertiary)',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.7
                            }}
                            title="Skill Radar"
                        >
                            <span>{t('app.skills')}</span>
                        </button>

                        <div style={{ width: '12px', borderRight: '1px solid var(--border-subtle)', height: '16px' }} />

                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)' }} data-testid="show-all-toggle">
                            <input
                                type="checkbox"
                                checked={showAllCommits}
                                onChange={toggleShowAllCommits}
                                style={{ accentColor: 'var(--accent-primary)' }}
                            />
                            {t('common.showAll')}
                        </label>

                        {/* Theme Toggle */}
                        <div className="theme-toggle-group">
                            <button
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`theme-toggle-option ${theme === 'light' ? 'active' : ''}`}
                                data-testid="theme-light-btn"
                                title={t('app.theme.light')}
                            >
                                <Sun size={12} strokeWidth={2.5} />
                                <span>{t('app.theme.light')}</span>
                            </button>
                            <button
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`theme-toggle-option ${theme === 'dark' ? 'active' : ''}`}
                                data-testid="theme-dark-btn"
                                title={t('app.theme.dark')}
                            >
                                <Moon size={12} strokeWidth={2.5} />
                                <span>{t('app.theme.dark')}</span>
                            </button>
                        </div>
                    </div>
                </DeveloperTabs>

                {/* ROW 2: Stacked Content (Graph & Bottom Panel) */}
                <div ref={stackContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>

                    {/* Top Section: Sidebar + Graph Area */}
                    <div ref={centerContentRef} style={{ height: vizHeight, minHeight: '100px', display: 'flex', flexDirection: 'row', borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative' }}>

                        {/* SIDEBAR (Vertical Menu) */}
                        <div style={{
                            width: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: '12px',
                            gap: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRight: '1px solid var(--border-subtle)',
                            zIndex: 20,
                            flexShrink: 0
                        }}>
                            {/* Search Toggle */}
                            <button
                                onClick={() => toggleSearchMode('commit')}
                                title={t('app.searchPlaceholder')}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    padding: 0,
                                    background: (isSearchOpen && searchFocus === 'commit') ? 'rgba(var(--accent-primary-rgb), 0.15)' : 'transparent',
                                    color: (isSearchOpen && searchFocus === 'commit') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    boxShadow: (isSearchOpen && searchFocus === 'commit') ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                }}
                                className="hover:bg-white hover:bg-opacity-5"
                            >
                                {(isSearchOpen && searchFocus === 'commit') && (
                                    <motion.div
                                        layoutId="sidebar-active-bar"
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            width: '3px',
                                            height: '18px',
                                            background: 'var(--accent-primary)',
                                            borderRadius: '0 2px 2px 0'
                                        }}
                                    />
                                )}
                                <Search size={18} strokeWidth={2.5} />
                            </button>

                            {/* Branch Search Toggle */}
                            <button
                                onClick={() => toggleSearchMode('branch')}
                                title={t('viewMode.branches')}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    padding: 0,
                                    background: (isSearchOpen && searchFocus === 'branch') ? 'rgba(var(--accent-primary-rgb), 0.15)' : 'transparent',
                                    color: (isSearchOpen && searchFocus === 'branch') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    boxShadow: (isSearchOpen && searchFocus === 'branch') ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                }}
                                className="hover:bg-white hover:bg-opacity-5"
                            >
                                {(isSearchOpen && searchFocus === 'branch') && (
                                    <motion.div
                                        layoutId="sidebar-active-bar"
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            width: '3px',
                                            height: '18px',
                                            background: 'var(--accent-primary)',
                                            borderRadius: '0 2px 2px 0'
                                        }}
                                    />
                                )}
                                <GitBranch size={18} strokeWidth={2.5} />
                            </button>

                            {/* Tag Search Toggle */}
                            <button
                                onClick={() => toggleSearchMode('tag')}
                                title={t('viewMode.tags')}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    padding: 0,
                                    background: (isSearchOpen && searchFocus === 'tag') ? 'rgba(var(--accent-primary-rgb), 0.15)' : 'transparent',
                                    color: (isSearchOpen && searchFocus === 'tag') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    boxShadow: (isSearchOpen && searchFocus === 'tag') ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                }}
                                className="hover:bg-white hover:bg-opacity-5"
                            >
                                {(isSearchOpen && searchFocus === 'tag') && (
                                    <motion.div
                                        layoutId="sidebar-active-bar"
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            width: '3px',
                                            height: '18px',
                                            background: 'var(--accent-primary)',
                                            borderRadius: '0 2px 2px 0'
                                        }}
                                    />
                                )}
                                <Tag size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Graph Area */}
                        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <AnimatePresence mode="wait">
                                {state.HEAD && state.HEAD.type !== 'none' ? (
                                    <motion.div
                                        key="graph"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <GitGraphViz
                                            onSelect={(commitData) => handleObjectSelect({ type: 'commit', id: commitData.id, data: commitData })}
                                            selectedCommitId={selectedObject?.type === 'commit' ? selectedObject.id : undefined}
                                            searchQuery={searchQuery}
                                            searchFocus={searchFocus}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
                                    >
                                        {t('common.noRepoLoaded')}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>


                        {/* Commit Details Pane */}
                        {selectedObject?.type === 'commit' && (
                            <>
                                <Resizer orientation="vertical" onMouseDown={startResizeDetails} />
                                <div style={{ width: `${detailsPaneWidth}px`, flexShrink: 0 }}>
                                    <CommitDetails
                                        commitId={selectedObject.id}
                                        onClose={() => setSelectedObject(null)}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Horizontal Resizer (Graph vs Bottom) */}
                    <Resizer orientation="horizontal" onMouseDown={startResizeCenterVert} />

                    {/* Bottom Panel (Explorer/Terminal) */}
                    <BottomPanel onSelect={(fileObj: SelectedObject) => handleObjectSelect(fileObj)} />
                </div>
            </div>

            {/* --- Modals --- */}
            <AddDeveloperModal
                isOpen={isAddDevModalOpen}
                onClose={() => setIsAddDevModalOpen(false)}
                onAddDeveloper={addDeveloper}
            />

            <SkillRadar
                isOpen={isSkillRadarOpen}
                onClose={() => setIsSkillRadarOpen(false)}
            />

            <GitDojo
                isOpen={isDojoOpen}
                onClose={() => setIsDojoOpen(false)}
                onOpen={() => setIsDojoOpen(true)}
            />
            <MissionPanel />
        </div>
    );
};

export default AppLayout;
