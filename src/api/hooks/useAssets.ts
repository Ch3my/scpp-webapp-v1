import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Asset, AssetListItem, CreateAsset } from '@/models/Asset';

/** List rows carry no image - `GET /assets/{id}` is the only place it is served. */
export function useAssets() {
    return useQuery({
        queryKey: queryKeys.assets.list(),
        queryFn: async () => {
            const { data } = await api.get<AssetListItem[]>('/assets');
            return data;
        },
    });
}

/** The image. One asset, one request - and it 404s for an unknown id. */
export function useAsset(id: number | null) {
    return useQuery({
        queryKey: queryKeys.assets.detail(id ?? 0),
        queryFn: async () => {
            const { data } = await api.get<Asset>(`/assets/${id}`);
            return data;
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
