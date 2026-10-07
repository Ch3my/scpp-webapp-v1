/**
 * Extracts a readable message from an API failure.
 *
 * The API returns `{ hasErrors: true, errorDescription: string[] }` with a non-2xx
 * status, so axios throws before the body can be inspected and `error.message` is
 * just "Request failed with status code 400". This digs the real description out.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Error desconocido'): string {
    const anyErr = err as any;
    const desc = anyErr?.response?.data?.errorDescription;
    if (Array.isArray(desc) && desc.length > 0) return String(desc[0]);
    return anyErr?.message ? String(anyErr.message) : fallback;
}
