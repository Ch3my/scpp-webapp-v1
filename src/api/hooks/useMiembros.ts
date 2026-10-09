import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Miembro, CreateMiembro, UpdateMiembro } from '@/models/Miembro';

/**
 * People in the caller's family. The default (active only) is what a "para" picker
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
