import { DateTime } from 'luxon';

/**
 * '2026-10-13' -> '13 oct' (or '13 oct 2026' with `withYear`). The locale is passed
 * explicitly because Settings.defaultLocale is only set inside the lazy chart
 * modules, which have not necessarily loaded yet.
 */
export function formatFecha(fecha: string, withYear = false) {
    const parsed = DateTime.fromFormat(fecha, 'yyyy-MM-dd');
    if (!parsed.isValid) return fecha;
    return parsed.toFormat(withYear ? 'dd MMM yyyy' : 'dd MMM', { locale: 'es' });
}

/**
 * Compact date for dense lists: '13 oct' this year, '13 oct 24' otherwise. A search
 * can return rows from any year, so the year only disappears when it is implied.
 */
export function formatFechaCorta(fecha: string) {
    const parsed = DateTime.fromFormat(fecha, 'yyyy-MM-dd');
    if (!parsed.isValid) return fecha;
    const sameYear = parsed.year === DateTime.now().year;
    return parsed.toFormat(sameYear ? 'dd MMM' : 'dd MMM yy', { locale: 'es' });
}
