import { useQuery } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Categoria, TipoDoc } from '@/models/Catalogos';

/**
 * The two global reference tables (`/categorias`, `/tipo-docs` - read-only
 * server side, and not scoped to a user). These are the only source for them;
 * they used to be duplicated in the zustand store, fetched by hand at boot and
 * at login.
 *
 * `staleTime` is an hour rather than Infinity because the cache is now
 * persisted (api/persist.ts): Infinity plus a restored `dataUpdatedAt` means a
 * table hydrated once would never be refetched again, not even in a later
 * session. `gcTime: Infinity` keeps them in memory, which is also what
 * guarantees they are in the snapshot written to disk - so the comboboxes fill
 * in offline.
 */
const LOOKUP_STALE_TIME = 60 * 60 * 1000;

export function useCategorias() {
    return useQuery({
        queryKey: queryKeys.lookups.categorias(),
        queryFn: async () => {
            const { data } = await api.get<Categoria[]>('/categorias');
            return data;
        },
        staleTime: LOOKUP_STALE_TIME,
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
        staleTime: LOOKUP_STALE_TIME,
        gcTime: Infinity,
    });
}
