import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { useAppState } from '@/AppState';
import { FoodTransaction } from '@/models/FoodTransaction';
import { DateTime } from 'luxon';
import {
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';
import { columns } from '@/table-columns-def/food-transactions-columns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from './ui/skeleton';

export interface FoodTransactionsRef {
    refetch: () => void;
}
export interface FoodTransactionsProps {
    onTransactionEdit?: (id: number) => void;
    foodItemIdFilter: number;
    codeFilter: string;
}
const FoodTransactions = forwardRef<FoodTransactionsRef, FoodTransactionsProps>(({ onTransactionEdit, foodItemIdFilter, codeFilter }, ref) => {
    const { apiPrefix, sessionId } = useAppState()
    const queryClient = useQueryClient();
    const [sorting, setSorting] = useState<SortingState>([{ id: 'bestBefore', desc: false }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )

    const { data: transactions = [], refetch, isLoading } = useQuery<FoodTransaction[]>({
        queryKey: ['transactions', foodItemIdFilter],
        queryFn: async () => {
            let params = new URLSearchParams();
            params.set("sessionHash", sessionId);
            params.set("page", String(1));
            params.set("itemId", String(foodItemIdFilter));

            let response = await fetch(`${apiPrefix}/food/transaction?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let apiData: any[] = await response.json();

            return apiData.map((item: any) => {
                let food = {
                    id: item.item_id,
                    name: item.item_name,
                    unit: item.item_unit,
                    quantity: null,
                    lastTransactionAt: null
                }
                return {
                    id: item.id,
                    itemId: item.item_id,
                    changeQty: item.change_qty,
                    occurredAt: DateTime.fromISO(item.occurred_at, { zone: 'utc' }),
                    transactionType: item.transaction_type,
                    note: item.note,
                    code: item.code,
                    bestBefore: item.best_before ? DateTime.fromISO(item.best_before, { zone: 'utc' }) : null,
                    food: food,
                    remainingQuantity: item.remaining_quantity,
                    fkTransaction: item.fk_transaction
                }
            });
        }
    });

    useImperativeHandle(ref, () => ({
        refetch
    }));

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`${apiPrefix}/food/transaction`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionHash: sessionId, id: id }),

            }).then(response => response.json())
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', foodItemIdFilter] });
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            toast('Transacción eliminada');
        }
    })

    const table = useReactTable({
        data: transactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        meta: {
            onTransactionDeleted: (id: number) => deleteMutation.mutate(id),
            onTransactionEdit: onTransactionEdit
        }
    })

    useEffect(() => {
        table.getColumn('code')?.setFilterValue(codeFilter)
    }, [codeFilter]);

    return (
        <div>
            <Table size='compact'>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell colSpan={columns.length}>
                                    <Skeleton className="h-8 w-full" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

export default FoodTransactions;
