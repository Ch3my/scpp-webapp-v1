import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Proyecto, CreateProyecto, UpdateProyecto } from '@/models/Proyecto';

export function useProyectos() {
    return useQuery({
        queryKey: queryKeys.proyectos.list(),
        queryFn: async () => {
            const { data } = await api.get<Proyecto[]>('/proyectos');
            return data;
        },
    });
}

export function useSaveProyecto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateProyecto | UpdateProyecto) => {
            const isEdit = 'id' in payload;
            const { data } = await api[isEdit ? 'put' : 'post']('/proyectos', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.proyectos.all });
        },
    });
}

export function useDeleteProyecto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete('/proyectos', { data: { id } });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.proyectos.all });
            // Gastos carry fk_proyecto, so the docs lists can be stale too
            queryClient.invalidateQueries({ queryKey: queryKeys.documentos.lists() });
        },
    });
}
