import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { useAppState } from '@/AppState';
import { clearPersistedCache } from '../persist';
import { queryKeys } from '../queryKeys';
import type { components } from '../schema';

type LoginSuccess = components['schemas']['LoginSuccessResponse'];
export type Me = components['schemas']['Me'];

/**
 * Who is logged in: user, family, miembro and `rol` ('admin' | 'miembro'). Use it to
 * decide what to *show*; the server already limits what each role can read or change.
 * It only changes at login, and the cache is cleared at every session boundary, so it
 * never needs refetching within a session.
 */
export function useMe(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: async () => {
            const { data } = await api.get<Me>('/me');
            return data;
        },
        enabled,
        staleTime: Infinity,
    });
}

export function useLogin() {
    return useMutation({
        mutationFn: async (credentials: { username: string; password: string }) => {
            const { data } = await api.post<LoginSuccess>('/login', credentials);
            return data;
        },
        // A session that ended without a logout (expired, or the app was just
        // closed) leaves its persisted cache behind. Dropping it here is what
        // stops a second user hydrating the first one's figures.
        onSuccess: () => {
            clearPersistedCache();
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const setLoggedIn = useAppState((s) => s.setLoggedIn);
    const setSessionId = useAppState((s) => s.setSessionId);

    return useMutation({
        mutationFn: async () => {
            await api.post('/logout', {});
        },
        // onSettled, not onSuccess: a failed or unreachable server must still
        // sign the user out locally rather than trap them in the app.
        onSettled: () => {
            setLoggedIn(false);
            setSessionId('');
            // Drop every cached response so the next session starts clean:
            // from memory, and from IndexedDB. (A throttled write may still
            // land after this, but by then the cache it copies is empty.)
            queryClient.clear();
            clearPersistedCache();
        },
    });
}
