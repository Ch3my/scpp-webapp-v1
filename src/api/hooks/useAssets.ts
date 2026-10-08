import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Asset, CreateAsset } from '@/models/Asset';

/** List rows carry no `assetData` - fetch one by id to get the image. */
export function useAssets() {
    return useQuery({
        queryKey: queryKeys.assets.list(),
        queryFn: async () => {
            const { data } = await api.get<Asset[]>('/assets');
            return data;
        },
    });
}

export function useAsset(id: number | null) {
    return useQuery({
        queryKey: queryKeys.assets.detail(id ?? 0),
        queryFn: async () => {
            const { data } = await api.get<Asset[]>('/assets', {
                params: { 'id[]': id },
            });
            return data[0];
        },
        enabled: !!id,
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateAsset) => {
            const { data } = await api.post('/assets', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() });
        },
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete('/assets', { data: { id } });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        },
    });
}
