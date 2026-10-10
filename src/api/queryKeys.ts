/**
 * Hierarchical query keys. Ported from scpp-app-v2/api/queryKeys.ts and
 * extended with the domains the mobile app never covered: proyectos, apiKeys,
 * food writes, and the two extra dashboard series.
 *
 * The hierarchy is what makes partial invalidation work - invalidating
 * `documentos.lists()` leaves cached details alone, and invalidating
 * `dashboard.all` refreshes every chart at once.
 */

export interface DocumentFilters {
    fechaInicio?: string;
    fechaTermino?: string;
    fk_tipoDoc?: number;
    fk_categoria?: number | null;
    fk_proyecto?: number;
    /** Only this miembro's gastos; 0/null means everyone */
    fk_miembro?: number | null;
    searchPhrase?: string;
    searchPhraseIgnoreOtherFilters?: boolean;
}

export const queryKeys = {
    // No `auth` key on purpose. /check-session is a probe, not data: its answer
    // is never rendered and is worthless a moment later, so it must not be
    // cached - which is why App.tsx calls it through the axios client directly
    // rather than through a query. There used to be an unused `auth.session()`
    // key here inviting someone to wire it up.

    // GET /me: the caller's family and role. Unlike /check-session this is data the
    // UI renders (admin-only screens), so it is a query.
    me: ['me'] as const,

    // Every series takes the dashboard's person filter (miembroId, 0 = everyone),
    // so each person's figures are cached separately and switching back is instant.
    dashboard: {
        all: ['dashboard'] as const,
        monthlyGraph: (nMonths: number, miembroId = 0) =>
            [...queryKeys.dashboard.all, 'monthly-graph', { nMonths, miembroId }] as const,
        expensesByCategory: (nMonths: number, miembroId = 0) =>
            [...queryKeys.dashboard.all, 'expenses-by-category', { nMonths, miembroId }] as const,
        expensesByCategoryTimeseries: (nMonths: number, miembroId = 0) =>
            [...queryKeys.dashboard.all, 'expenses-by-category-timeseries', { nMonths, miembroId }] as const,
        currMonthSpending: (miembroId = 0) =>
            [...queryKeys.dashboard.all, 'curr-month-spending', { miembroId }] as const,
        yearlySum: (nMonths: number, miembroId = 0) =>
            [...queryKeys.dashboard.all, 'yearly-sum', { nMonths, miembroId }] as const,
    },

    documentos: {
        all: ['documentos'] as const,
        lists: () => [...queryKeys.documentos.all, 'list'] as const,
        list: (filters: DocumentFilters) =>
            [...queryKeys.documentos.lists(), filters] as const,
        byProyecto: (proyectoId: number) =>
            [...queryKeys.documentos.lists(), { proyectoId }] as const,
        details: () => [...queryKeys.documentos.all, 'detail'] as const,
        detail: (id: number) => [...queryKeys.documentos.details(), id] as const,
        // Under documentos.all so a documento write also drops cached
        // suggestions (the server itself only retrains once a day)
        sugerenciaCategoria: (proposito: string, monto: number) =>
            [...queryKeys.documentos.all, 'sugerencia-categoria', { proposito, monto }] as const,
    },

    proyectos: {
        all: ['proyectos'] as const,
        lists: () => [...queryKeys.proyectos.all, 'list'] as const,
        list: () => [...queryKeys.proyectos.lists()] as const,
        details: () => [...queryKeys.proyectos.all, 'detail'] as const,
        detail: (id: number) => [...queryKeys.proyectos.details(), id] as const,
    },

    assets: {
        all: ['assets'] as const,
        lists: () => [...queryKeys.assets.all, 'list'] as const,
        list: () => [...queryKeys.assets.lists()] as const,
        details: () => [...queryKeys.assets.all, 'detail'] as const,
        detail: (id: number) => [...queryKeys.assets.details(), id] as const,
    },

    food: {
        all: ['food'] as const,
        items: () => [...queryKeys.food.all, 'items'] as const,
        itemQuantity: (itemId?: number) =>
            [...queryKeys.food.all, 'item-quantity', { itemId: itemId ?? null }] as const,
        transactions: () => [...queryKeys.food.all, 'transactions'] as const,
        transactionList: (filters: { itemId?: number; code?: string }) =>
            [...queryKeys.food.transactions(), filters] as const,
    },

    apiKeys: {
        all: ['api-keys'] as const,
        lists: () => [...queryKeys.apiKeys.all, 'list'] as const,
        list: () => [...queryKeys.apiKeys.lists()] as const,
    },

    // Platform administration (super-admins only)
    admin: {
        all: ['admin'] as const,
        familias: () => [...queryKeys.admin.all, 'familias'] as const,
    },

    miembros: {
        all: ['miembros'] as const,
        /** `todos` includes deactivated ones (the admin's management list) */
        list: (todos: boolean) => [...queryKeys.miembros.all, 'list', { todos }] as const,
    },

    lookups: {
        all: ['lookups'] as const,
        categorias: () => [...queryKeys.lookups.all, 'categorias'] as const,
        tipoDocs: () => [...queryKeys.lookups.all, 'tipo-docs'] as const,
    },
} as const;
