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
