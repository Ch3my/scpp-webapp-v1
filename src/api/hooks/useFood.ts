import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import api from '../client';
import { queryKeys } from '../queryKeys';
import type { Food, FoodItemWire, FoodItemQuantityWire } from '@/models/Food';
import type { FoodTransaction, FoodTransactionWire } from '@/models/FoodTransaction';

/**
 * The only place the wire format is turned into the view model. Dates are
 * parsed as UTC - the API sends naive timestamps and reading them in local
 * time shifts best-before dates across a day boundary.
 */
function toFood(item: FoodItemQuantityWire): Food {
    return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        lastTransactionAt: item.last_transaction_at
            ? DateTime.fromISO(item.last_transaction_at, { zone: 'utc' })
            : null,
    };
}

function toFoodTransaction(item: FoodTransactionWire): FoodTransaction {
    return {
        id: item.id,
        itemId: item.item_id,
        changeQty: item.change_qty,
        transactionType: item.transaction_type,
        occurredAt: DateTime.fromISO(item.occurred_at, { zone: 'utc' }),
        note: item.note,
        code: item.code,
        bestBefore: item.best_before
            ? DateTime.fromISO(item.best_before, { zone: 'utc' })
            : null,
        food: {
            id: item.item_id,
            name: item.item_name ?? '',
            unit: item.item_unit ?? '',
            quantity: null,
            lastTransactionAt: null,
        },
        remainingQuantity: item.remaining_quantity,
        fkTransaction: item.fk_transaction,
    };
}

/** A write anywhere in food invalidates both the inventory and the ledger. */
function invalidateFood(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: queryKeys.food.all });
}

/**
 * Inventory with current quantities. Shared by FoodSummary and the alimentos
 * combobox, which previously fetched this same endpoint under two different
 * keys and so hit the network twice.
 */
export function useFoodItemQuantity() {
    return useQuery({
        queryKey: queryKeys.food.itemQuantity(),
        queryFn: async () => {
            const { data } = await api.get<FoodItemQuantityWire[]>('/food/item-quantity');
            return data.map(toFood);
        },
    });
}

export function useFoodItem(id: number) {
    return useQuery({
        queryKey: [...queryKeys.food.items(), id],
        queryFn: async () => {
            const { data } = await api.get<FoodItemWire[]>('/food/items', {
                params: { 'id[]': id },
            });
            return data[0] ?? null;
        },
        enabled: id > 0,
    });
}

export function useSaveFoodItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payload, isEdit }: { payload: unknown; isEdit: boolean }) => {
            const { data } = await api[isEdit ? 'put' : 'post']('/food/item', payload);
            return data;
        },
        onSuccess: () => invalidateFood(queryClient),
    });
}

export function useDeleteFoodItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete('/food/item', { data: { id } });
            return id;
        },
        onSuccess: () => invalidateFood(queryClient),
    });
}

export function useFoodTransactions(itemId: number) {
    return useQuery({
        queryKey: queryKeys.food.transactionList({ itemId: itemId || undefined }),
        queryFn: async () => {
            const { data } = await api.get<FoodTransactionWire[]>('/food/transaction', {
                params: { page: 1, itemId: itemId || undefined },
            });
            return data.map(toFoodTransaction);
        },
    });
}

export function useFoodTransaction(id: number | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: [...queryKeys.food.transactions(), 'detail', id ?? 0],
        queryFn: async () => {
            const { data } = await api.get<FoodTransactionWire[]>('/food/transaction', {
                params: { id },
            });
            return toFoodTransaction(data[0]);
        },
        enabled: enabled && !!id,
        staleTime: 0,
    });
}

/** Codes already in use, for suggesting the next free one. */
export function useUsedTransactionCodes(enabled: boolean) {
    return useQuery({
        queryKey: [...queryKeys.food.transactions(), 'codes'],
        queryFn: async () => {
            const { data } = await api.get<FoodTransactionWire[]>('/food/transaction', {
                params: { page: 1 },
            });
            return data
                .map((item) => (item.code ?? '').toString().trim())
                .filter((code) => code !== '');
        },
        enabled,
    });
}

export function useSaveFoodTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payload, isEdit }: { payload: unknown; isEdit: boolean }) => {
            const { data } = await api[isEdit ? 'put' : 'post']('/food/transaction', payload);
            return data;
        },
        onSuccess: () => invalidateFood(queryClient),
    });
}

export function useDeleteFoodTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete('/food/transaction', { data: { id } });
            return id;
        },
        onSuccess: () => invalidateFood(queryClient),
    });
}

/** Quick-adjust from the transactions table (the "subtract one" action). */
export function useAdjustTransactionQty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, changeQty }: { id: number; changeQty: number }) => {
            const { data } = await api.put('/food/transaction', { id, quantity: changeQty });
            return data;
        },
        onSuccess: () => invalidateFood(queryClient),
    });
}
