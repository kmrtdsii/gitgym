import type { TFunction } from 'i18next';

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "yesterday").
 * matches GitHub style.
 */
export const formatRelativeTime = (dateInput: Date | string | number, t: TFunction): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Future dates (shouldn't happen for commits usually, but handled gracefully)
    if (diffInSeconds < 0) {
        return t('time.justNow', 'just now');
    }

    if (diffInSeconds < 60) {
        return t('time.justNow', 'just now');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return t('time.minutesAgo', { count: diffInMinutes, defaultValue: '{{count}} minutes ago' });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return t('time.hoursAgo', { count: diffInHours, defaultValue: '{{count}} hours ago' });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return t('time.yesterday', 'yesterday');
    }

    if (diffInDays < 30) {
        return t('time.daysAgo', { count: diffInDays, defaultValue: '{{count}} days ago' });
    }

    // Older than 30 days: "on <date>"
    // GitHub format: "on Jan 1, 2024"
    // We use localized date format
    return t('time.onDate', {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        defaultValue: 'on {{date}}'
    });
};
