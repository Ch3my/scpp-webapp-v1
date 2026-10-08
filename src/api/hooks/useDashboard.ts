import { useQuery } from '@tanstack/react-query';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { MonthlyGraphData } from '@/models/MonthlyGraphData';
import type { components } from '../schema';

type Schemas = components['schemas'];

/** Row of the `data` array in the expenses-by-category response. */
export type ExpensesByCategoryRow = Schemas['ExpensesByCategoryResponse']['data'][number];
export type ExpensesByCategoryResponse = Schemas['ExpensesByCategoryResponse'];
export type ExpensesByCategoryTimeseriesResponse =
    Schemas['ExpensesByCategoryTimeseriesResponse'];
export type CurrentMonthSpendingResponse = Schemas['CurrentMonthSpendingResponse'];
export type YearlySumResponse = Schemas['YearlySumResponse'];

/**
 * One hook per series rather than the bundled useDashboardQueries the mobile
 * app used: the web dashboard lazy-loads each chart independently, so
 * bundling them would defeat the code splitting.
 *
 * Recharts-specific reshaping stays in the chart components - that is a view
 * concern. These hooks only own fetching and caching.
 */

export function useMonthlyGraph(nMonths: number, offset: number = 0) {
    return useQuery<MonthlyGraphData>({
        queryKey: [...queryKeys.dashboard.monthlyGraph(nMonths), { offset }],
        queryFn: async () => {
            const { data } = await api.get('/monthly-graph', {
                params: { nMonths, offset },
            });
            return data;
        },
    });
}

/** nMonths=0 is the current month only. */
export function useExpensesByCategory(nMonths: number) {
    return useQuery<ExpensesByCategoryResponse>({
        queryKey: queryKeys.dashboard.expensesByCategory(nMonths),
        queryFn: async () => {
            const { data } = await api.get('/expenses-by-category', {
                params: { nMonths },
            });
            return data;
        },
    });
}

export function useExpensesByCategoryTimeseries(nMonths: number) {
    return useQuery<ExpensesByCategoryTimeseriesResponse>({
        queryKey: queryKeys.dashboard.expensesByCategoryTimeseries(nMonths),
        queryFn: async () => {
            const { data } = await api.get('/expenses-by-category-timeseries', {
                params: { nMonths },
            });
            return data;
        },
    });
}

export function useCurrMonthSpending() {
    return useQuery<CurrentMonthSpendingResponse>({
        queryKey: queryKeys.dashboard.currMonthSpending(),
        queryFn: async () => {
            const { data } = await api.get('/curr-month-spending');
            return data;
        },
    });
}

export function useYearlySum(nMonths: number = 12) {
    return useQuery<YearlySumResponse>({
        queryKey: queryKeys.dashboard.yearlySum(nMonths),
        queryFn: async () => {
            const { data } = await api.get('/yearly-sum', { params: { nMonths } });
            return data;
        },
    });
}
