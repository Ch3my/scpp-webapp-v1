import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Miembro, CreateMiembro, UpdateMiembro, GrantAcceso, UpdateAcceso } from '@/models/Miembro';

/**
 * People in the caller's family. The default (active only) is what the person picker
 * offers; `todos` adds deactivated ones and is honoured for admins only.
 */
export function useMiembros(todos: boolean = false) {
    return useQuery({
        queryKey: queryKeys.miembros.list(todos),
        queryFn: async () => {
            const { data } = await api.get<Miembro[]>('/miembros', {
                params: todos ? { todos: 'true' } : undefined,
            });
            return data;
        },
    });
}

/** Admin only: add a label-only miembro, or rename / reorder / (de)activate one. */
export function useSaveMiembro() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateMiembro | UpdateMiembro) => {
            const isEdit = 'id' in payload;
            const { data } = await api[isEdit ? 'put' : 'post']('/miembros', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.miembros.all });
            // Gastos carry the miembro's name, so a rename shows up in the lists
            queryClient.invalidateQueries({ queryKey: queryKeys.documentos.lists() });
        },
    });
}

/**
 * Admin only: give a miembro a login (POST) or change one (PUT: role, access on/off,
 * password reset). The server refuses an admin changing their own access.
 */
export function useSaveAcceso() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { grant: GrantAcceso } | { update: UpdateAcceso }) => {
            const { data } = 'grant' in payload
                ? await api.post('/miembros/acceso', payload.grant)
                : await api.put('/miembros/acceso', payload.update);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.miembros.all });
        },
    });
}

/** Change the caller's own password; the current one is required. */
export function useChangePassword() {
    return useMutation({
        mutationFn: async (payload: { actual: string; nueva: string }) => {
            const { data } = await api.put('/me/password', payload);
            return data;
        },
    });
}

/**
 * Whether the family has more than one (active) person - the point at which showing
 * whose a gasto is, and letting the admin pick it, starts to mean something.
 */
export function useHasMultiplePeople(): boolean {
    const { data: miembros = [] } = useMiembros();
    return miembros.length > 1;
}
