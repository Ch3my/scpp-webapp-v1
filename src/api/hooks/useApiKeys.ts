import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type {
    ApiKey,
    ApiKeysListResponse,
    CreateApiKeyPayload,
    CreateApiKeyResponse,
} from '@/models/ApiKey';

export function useApiKeys() {
    return useQuery<ApiKey[]>({
        queryKey: queryKeys.apiKeys.list(),
        queryFn: async () => {
            const { data } = await api.get<ApiKeysListResponse>('/api-keys');
            return data.apiKeys;
        },
    });
}

export function useCreateApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateApiKeyPayload) => {
            const { data } = await api.post<CreateApiKeyResponse>('/api-keys', payload);
            // The plaintext key is returned here and nowhere else
            return data.apiKey;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
        },
    });
}

export function useDeleteApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api-keys/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
        },
    });
}

export function useRevokeApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/api-keys/${id}/revoke`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
        },
    });
}
