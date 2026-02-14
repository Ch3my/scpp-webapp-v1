import React from 'react';

import {
    flexRender,
    getCoreRowModel,
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
import { Food } from "@/models/Food"
import { columns } from "@/table-columns-def/food-summary-columns"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import api from "@/lib/api";

interface FoodSummaryProps {
    onEditFoodItem: (id: number) => void;
    onOpenFoodItemDialog: (isOpen: boolean) => void;
    foodItemIdFilter: number;
    onViewDetail: (id: number) => void;
}

export function FoodSummary({ onEditFoodItem, onOpenFoodItemDialog, foodItemIdFilter, onViewDetail }: FoodSummaryProps) {
    const queryClient = useQueryClient();
    const [sorting, setSorting] = React.useState<SortingState>([])

    const { data: foods = [], isLoading } = useQuery<Food[]>({
        queryKey: ['foods'],
        queryFn: async () => {
            const { data: apiData } = await api.get("/food/item-quantity");

            const transformedData = apiData.map((item: any) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                lastTransactionAt: item.last_transaction_at ? DateTime.fromISO(item.last_transaction_at) : null
            }));
            return transformedData;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete("/food/item", { data: { id } });
            if (data.hasErrors) {
                throw new Error(data.errorDescription[0]);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            toast('Item eliminado');
        },
        onError: (error) => {
            toast.error('Error al eliminar el item: ' + error.message);
        }
    })

    const filteredFoods = foodItemIdFilter === 0
        ? foods
        : foods.filter(f => f.id === foodItemIdFilter);

    const table = useReactTable({
        data: filteredFoods,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        meta: {
            deleteFoodItem: (id: number) => deleteMutation.mutate(id),
            editFoodItem: (id: number) => {
                onEditFoodItem(id);
                onOpenFoodItemDialog(true);
            },
            viewDetail: (id: number) => onViewDetail(id)
        }
    })

    return (
        <div className="overflow-y-auto">
            <Table size='compact'>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
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
    )
}