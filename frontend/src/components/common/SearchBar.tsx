import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    icon?: React.ReactNode;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search...", autoFocus, icon }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onChange(localValue);
        }, 200); // 200ms debounce
        return () => clearTimeout(timeoutId);
    }, [localValue, onChange]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '32px',
            background: 'var(--bg-primary)',
            border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            borderRadius: '6px',
            padding: '0 10px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isFocused ? '0 0 0 2px rgba(var(--accent-primary-rgb), 0.2), 0 2px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', color: isFocused ? 'var(--accent-primary)' : 'var(--text-tertiary)', marginRight: '8px', transition: 'color 0.2s' }}>
                {icon || <Search size={14} />}
            </div>
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    flex: 1,
                    fontFamily: 'inherit'
                }}
            />
            {localValue && (
                <button
                    onClick={() => {
                        setLocalValue('');
                        onChange('');
                        inputRef.current?.focus();
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    className="hover:bg-white hover:bg-opacity-10"
                >
                    <X size={12} color="var(--text-tertiary)" />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
