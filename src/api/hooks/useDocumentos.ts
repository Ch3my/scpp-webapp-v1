import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { queryKeys, type DocumentFilters } from '../queryKeys';
import type { CategoriaSugerida, Documento } from '@/models/Documento';

/**
 * Invalidated together by every documento write: the dashboard charts are all
 * derived from the same rows, and proyecto initialDate/finalDate are computed
 * from the linked gastos.
 */
function invalidateDocumentoDependents(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: queryKeys.documentos.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.proyectos.all });
}

export function useDocumentos(filters: DocumentFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.documentos.list(filters),
        queryFn: async () => {
            const { data } = await api.get<Documento[]>('/documentos', {
                params: {
                    ...filters,
                    // A categoria of 0 means "all" and must be omitted, not sent
                    fk_categoria: filters.fk_categoria || undefined,
                },
            });
            return data;
        },
        enabled,
        placeholderData: (previous) => previous,
    });
}

/**
 * Gastos of one proyecto, over the exact window the server computed for it.
 *
 * `searchPhraseIgnoreOtherFilters` must be false: left at its default the
 * backend discards fk_proyecto and returns unrelated rows.
 */
export function useProyectoGastos(
    proyectoId: number,
    initialDate: string | null,
    finalDate: string | null
) {
    const hasGastos = initialDate !== null && finalDate !== null;

    return useQuery({
        queryKey: queryKeys.documentos.list({
            fk_proyecto: proyectoId,
            fechaInicio: initialDate ?? undefined,
            fechaTermino: finalDate ?? undefined,
        }),
        enabled: hasGastos,
        queryFn: async () => {
            const { data } = await api.get<Documento[]>('/documentos', {
                params: {
                    fk_proyecto: proyectoId,
                    fechaInicio: initialDate,
                    fechaTermino: finalDate,
                    searchPhrase: '',
                    searchPhraseIgnoreOtherFilters: false,
                },
            });
            return data;
        },
    });
}

export function useDocumento(id: number | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.documentos.detail(id ?? 0),
        queryFn: async () => {
            const { data } = await api.get<Documento[]>('/documentos', {
                params: { 'id[]': id },
            });
            return data[0];
        },
        enabled: enabled && !!id,
        staleTime: 0,
    });
}

export function useSaveDocumento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payload, isEdit }: { payload: unknown; isEdit: boolean }) => {
            // Cuotas are submitted as an array of documentos in one go
            if (Array.isArray(payload)) {
                const results = await Promise.all(
                    payload.map((p) => api.post('/documentos', p))
                );
                return results.map((r) => r.data);
            }
            const { data } = await api[isEdit ? 'put' : 'post']('/documentos', payload);
            return data;
        },
        onSuccess: () => invalidateDocumentoDependents(queryClient),
    });
}

export function useDeleteDocumento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete('/documentos', { data: { id } });
            return id;
        },
        onSuccess: () => invalidateDocumentoDependents(queryClient),
    });
}

/**
 * Asks the backend's classifier for a gasto's categoria, learned from past
 * gastos. Imperative because it runs on an event (leaving the proposito field),
 * not on render. `fk_categoria` is null when the classifier is not confident.
 */
export function useSugerirCategoria() {
    const queryClient = useQueryClient();
    return (proposito: string, monto: number): Promise<CategoriaSugerida | null> => {
        const trimmed = proposito.trim();
        if (trimmed.length < 2) return Promise.resolve(null);
        return queryClient.fetchQuery({
            queryKey: queryKeys.documentos.sugerenciaCategoria(trimmed, monto),
            queryFn: async () => {
                const { data } = await api.get<CategoriaSugerida>('/documentos/sugerir-categoria', {
                    params: { proposito: trimmed, monto },
                });
                return data;
            },
            // The server retrains once a day; within a session an answer holds
            staleTime: Infinity,
            // A failed suggestion just means picking by hand; retrying only delays that
            retry: false,
        });
    };
}
