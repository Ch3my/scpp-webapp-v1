import { useQuery } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Categoria, TipoDoc } from '@/models/Catalogos';

/** Lookup tables change rarely enough to cache for the whole session. */
export function useCategorias() {
    return useQuery({
        queryKey: queryKeys.lookups.categorias(),
        queryFn: async () => {
            const { data } = await api.get<Categoria[]>('/categorias');
            return data;
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });
}

export function useTipoDocs() {
    return useQuery({
        queryKey: queryKeys.lookups.tipoDocs(),
        queryFn: async () => {
            const { data } = await api.get<TipoDoc[]>('/tipo-docs');
            return data;
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });
}
