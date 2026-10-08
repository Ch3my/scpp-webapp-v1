import { QueryClient } from '@tanstack/react-query';

/**
 * Ported from scpp-app-v2/api/queryClient.ts, keeping this app's existing
 * 2-minute staleTime and adopting the mobile app's gcTime / retry settings.
 *
 * `refetchOnWindowFocus` stays at its default (true) on purpose. Returning to
 * the tab is exactly when stale figures should refresh, and with a warm cache
 * it costs nothing visible: rows render immediately and the request revalidates
 * in the background. Screens must therefore drive any "loading" affordance from
 * isLoading / isPlaceholderData, never from isFetching, which is also true for
 * these background refetches - see the note in screens/Dashboard.tsx.
 *
 * gcTime (30 min) is the setting that actually makes refocus cheap: it keeps
 * data cached well past staleTime, so a refetch updates rows in place instead
 * of dropping to a skeleton.
 *
 * gcTime also decides what survives to disk. api/persist.ts can only write
 * what is still in memory, so the offline cache is effectively "everything
 * used in the last 30 minutes of app-open time" - which is what you want on a
 * phone, where the app is opened, browsed and closed. Raising it would persist
 * more at the cost of holding every filter combination the user ever typed in
 * the documentos search, each of which is its own query key.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 120,
            gcTime: 30 * 60 * 1000,
            retry: 2,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1,
        },
    },
});
