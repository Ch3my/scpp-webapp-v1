import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { useAppState } from '@/AppState';
import type { components } from '../schema';

type LoginSuccess = components['schemas']['LoginSuccessResponse'];

export function useLogin() {
    return useMutation({
        mutationFn: async (credentials: { username: string; password: string }) => {
            const { data } = await api.post<LoginSuccess>('/login', credentials);
            return data;
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
            // Drop every cached response so the next session starts clean
            queryClient.clear();
        },
    });
}
