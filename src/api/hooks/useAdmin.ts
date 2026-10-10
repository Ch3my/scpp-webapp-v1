import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { FamiliaAdmin, CreateFamilia, UpdateFamilia } from '@/models/FamiliaAdmin';

/**
 * Platform administration, for super-admins (user.isSuperAdmin). Account management
 * only: the server never returns another family's data here.
 */
export function useFamiliasAdmin(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.admin.familias(),
        queryFn: async () => {
            const { data } = await api.get<FamiliaAdmin[]>('/admin/familias');
            return data;
        },
        enabled,
    });
}

/** Create a family with its first admin (POST) or rename one (PUT). */
export function useSaveFamilia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateFamilia | UpdateFamilia) => {
            const isEdit = 'id' in payload;
            const { data } = await api[isEdit ? 'put' : 'post']('/admin/familias', payload);
            return data;
        },
        onSuccess: (_data, payload) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
            // Renaming your own family changes what /me reports
            if ('id' in payload) queryClient.invalidateQueries({ queryKey: queryKeys.me });
        },
    });
}
