import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GitBranch, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchBar from '../common/SearchBar';
import type { Commit } from '../../types/gitTypes';

interface SearchNavigatorProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchFocus: 'commit' | 'branch' | 'tag';
    onSelectCommit: (commit: Commit) => void;
    branches: Record<string, string>;
    tags: Record<string, string>;
    commits: Commit[];
    remoteBranches?: Record<string, string>;
}

const SearchNavigator: React.FC<SearchNavigatorProps> = ({
    searchQuery,
    setSearchQuery,
    searchFocus,
    onSelectCommit,
    branches,
    tags,
    commits,
    remoteBranches
}) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);

    const commitMap = useMemo(() => new Map(commits.map(c => [c.id, c])), [commits]);

    const filteredItems = useMemo(() => {
        if (searchFocus === 'commit') return [];

        const query = searchQuery.toLowerCase();
        const items: { name: string; commitId: string; commit?: Commit; type: 'branch' | 'tag'; isRemote?: boolean }[] = [];

        if (searchFocus === 'branch') {
            Object.entries(branches).forEach(([name, id]) => {
                if (name.toLowerCase().includes(query)) {
                    items.push({ name, commitId: id, commit: commitMap.get(id), type: 'branch' });
                }
            });
            if (remoteBranches) {
                Object.entries(remoteBranches).forEach(([name, id]) => {
                    if (name.toLowerCase().includes(query)) {
                        items.push({ name, commitId: id, commit: commitMap.get(id), type: 'branch', isRemote: true });
                    }
                });
            }
        } else if (searchFocus === 'tag') {
            Object.entries(tags).forEach(([name, id]) => {
                if (name.toLowerCase().includes(query)) {
                    items.push({ name, commitId: id, commit: commitMap.get(id), type: 'tag' });
                }
            });
        }

        return items.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10);
    }, [searchFocus, searchQuery, branches, tags, remoteBranches, commitMap]);

    useEffect(() => {
        // Only auto-open if the query is shorter than the match (i.e. user is still typing)
        // or if we're not exactly matching a single item? 
        // Simpler: just don't open if it was just selected.
        setIsOpen(searchFocus !== 'commit' && searchQuery.length > 0 && !filteredItems.some(i => i.name === searchQuery));
    }, [searchFocus, searchQuery, filteredItems]);

    const handleSelect = (item: typeof filteredItems[0]) => {
        if (item.commit) {
            onSelectCommit(item.commit);
            setSearchQuery(item.name);
            setIsOpen(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '400px', marginRight: '8px' }}>
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                    searchFocus === 'commit' ? t('app.searchPlaceholder') :
                        searchFocus === 'branch' ? t('app.searchBranches') :
                            t('app.searchTags')
                }
                icon={
                    searchFocus === 'commit' ? <Search size={14} /> :
                        searchFocus === 'branch' ? <GitBranch size={14} /> :
                            <Tag size={14} />
                }
                autoFocus
            />

            <AnimatePresence>
                {isOpen && filteredItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 100,
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}
                    >
                        {filteredItems.map((item) => (
                            <div
                                key={`${item.type}-${item.isRemote ? 'remote-' : ''}${item.name}`}
                                onClick={() => handleSelect(item)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    transition: 'background 0.2s'
                                }}
                                className="hover:bg-opacity-10 hover:bg-white"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
                                    {item.type === 'branch' ? <GitBranch size={12} color={item.isRemote ? 'var(--text-secondary)' : 'var(--accent-primary)'} /> : <Tag size={12} color="var(--text-secondary)" />}
                                    <span style={{ color: item.type === 'branch' && !item.isRemote ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                        {item.name}
                                    </span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.commitId.slice(0, 7)} - {item.commit?.message || '...'}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchNavigator;
