import { DateTime } from 'luxon';

export function formatRelativeTime(isoDate: string | null): string {
    if (!isoDate) return 'Never';

    const date = DateTime.fromISO(isoDate);
    if (!date.isValid) return 'Invalid date';

    return date.toRelative() ?? date.toFormat('dd-MM-yyyy');
}

export function formatDate(isoDate: string | null): string {
    if (!isoDate) return 'Never';

    const date = DateTime.fromISO(isoDate);
    if (!date.isValid) return 'Invalid date';

    return date.toFormat('dd-MM-yyyy');
}
