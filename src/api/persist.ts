import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
    defaultShouldDehydrateQuery,
    type DehydrateOptions,
    type HydrateOptions,
    type Query,
} from '@tanstack/react-query';
import { createStore, get, set, del } from 'idb-keyval';
import { DateTime } from 'luxon';

/**
 * Persists the TanStack Query cache to IndexedDB, so an installed PWA launched
 * with no connection has something to show instead of empty screens.
 *
 * This is the *only* place authenticated responses are written to disk, and it
 * is deliberately not the service worker. A worker cache is keyed by URL, is
 * invisible to the app and outlives a logout; here the app owns the lifecycle -
 * `clearPersistedCache()` runs on login, on logout and on a 401, so one user's
 * figures can never be hydrated into another user's session.
 *
 * IndexedDB rather than localStorage: the quota is hundreds of MB instead of
 * ~5 MB shared with zustand's `app-storage`, and writes do not block the main
 * thread. The cost is an async restore, which `PersistQueryClientProvider` in
 * main.tsx handles - it holds queries off until hydration lands, so a fetch
 * cannot resolve first and overwrite what we restored.
 */

/** Its own database, so clearing the cache cannot touch anything else. */
const store = createStore('scpp-cache', 'query-cache');

const CACHE_KEY = 'query-client';

/** Older than this and we would be showing figures nobody should act on. */
export const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** The cache settles in bursts - a screen mounts and five queries resolve. */
const THROTTLE_MS = 1000;

/**
 * Luxon round-trip. `useFood` puts real `DateTime` objects in the cache and
 * `JSON.stringify` flattens those to ISO strings through their own `toJSON`,
 * so a hydrated screen would call `.toFormat()` on a string and crash. Tagging
 * on the way out and rebuilding on the way in keeps the query hooks as the only
 * place that knows about the wire format.
 *
 * Reviving with `{ zone: 'utc' }` matches how the hooks parse: the API sends
 * naive timestamps, and reading them locally shifts dates across day
 * boundaries.
 */
const LUXON_TAG = '__luxon_iso';

function encodeDates(value: unknown): unknown {
    if (DateTime.isDateTime(value)) {
        const iso = value.toISO();
        return iso ? { [LUXON_TAG]: iso } : null;
    }
    if (Array.isArray(value)) return value.map(encodeDates);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, encodeDates(v)]),
        );
    }
    return value;
}

function decodeDates(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(decodeDates);
    if (value && typeof value === 'object') {
        const tagged = (value as Record<string, unknown>)[LUXON_TAG];
        if (typeof tagged === 'string') {
            return DateTime.fromISO(tagged, { zone: 'utc' });
        }
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, decodeDates(v)]),
        );
    }
    return value;
}

function shouldDehydrateQuery(query: Query) {
    // Keeps the default rule (successful queries only) and adds one exclusion.
    if (!defaultShouldDehydrateQuery(query)) return false;

    const [domain, kind] = query.queryKey as [string?, string?];

    // Asset *details* only: that is the one response carrying a base64 image
    // (`GET /assets/{id}`), and persisting those would re-serialise every photo
    // the user has opened on each save. List rows are small since the backend
    // stopped selecting `assetData` for `GET /assets`, so the screen still
    // fills in offline - only the image itself needs a connection.
    if (domain === 'assets' && kind === 'detail') return false;

    return true;
}

export const queryPersister = createAsyncStoragePersister({
    key: CACHE_KEY,
    throttleTime: THROTTLE_MS,
    storage: {
        getItem: (key) => get<string>(key, store).then((v) => v ?? null),
        setItem: (key, value) => set(key, value, store),
        removeItem: (key) => del(key, store),
    },
});

export const dehydrateOptions: DehydrateOptions = {
    shouldDehydrateQuery,
    // An in-flight write must not be replayed from a cold start: a resurrected
    // gasto would be a silent duplicate.
    shouldDehydrateMutation: () => false,
    serializeData: encodeDates,
};

export const hydrateOptions: HydrateOptions = {
    defaultOptions: { deserializeData: decodeDates },
};

/**
 * Called on login, logout and 401. A persisted cache belongs to exactly one
 * session; the next one starts empty.
 */
export function clearPersistedCache() {
    // Fire and forget - the caller is already tearing the session down, and a
    // failure here must not block the sign-out.
    void queryPersister.removeClient();
}
