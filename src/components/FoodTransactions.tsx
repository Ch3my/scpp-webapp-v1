import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { FoodTransaction } from '@/models/FoodTransaction';
import {
    ColumnFiltersState,
    flexRender,
    SortingState,
    useTable,
} from "@tanstack/react-table"
import { tableFeaturesConfig } from "@/lib/table-features"
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
import { Skeleton } from './ui/skeleton';
import {
    useFoodTransactions,
    useDeleteFoodTransaction,
    useAdjustTransactionQty,
} from '@/api/hooks';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface FoodTransactionsRef {
    refetch: () => void;
}

interface FoodTransactionsProps {
    onTransactionEdit?: (transaction: FoodTransaction) => void;
    foodItemIdFilter: number;
    codeFilter: string;
}

const FoodTransactions = forwardRef<FoodTransactionsRef, FoodTransactionsProps>(({ onTransactionEdit, foodItemIdFilter, codeFilter }, ref) => {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'bestBefore', desc: false }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )

    const { data: transactions = [], isLoading, refetch } = useFoodTransactions(foodItemIdFilter);

    useImperativeHandle(ref, () => ({
        refetch
    }));

    const deleteMutation = useDeleteFoodTransaction();
    const subtractOneMutation = useAdjustTransactionQty();

    const onTransactionDeleted = (id: number) => {
        deleteMutation.mutate(id, {
            onSuccess: () => toast('Transacción eliminada'),
            onError: (error) => toast("Error al guardar la transacción " + getApiErrorMessage(error)),
        });
    };

    const onTransactionSubtractOne = (id: number, changeQty: number) => {
        subtractOneMutation.mutate({ id, changeQty }, {
            onSuccess: () => toast('Cantidad actualizada'),
            onError: (error) => toast("Error al guardar la transacción " + getApiErrorMessage(error)),
        });
    };

    const table = useTable({
        features: tableFeaturesConfig,
        data: transactions,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
        meta: {
            onTransactionDeleted,
            onTransactionEdit: onTransactionEdit,
            onTransactionSubtractOne
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
                                    <TableCell key={cell.id} className={(cell.column.columnDef.meta as any)?.className}>
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
