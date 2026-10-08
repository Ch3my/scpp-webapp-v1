import React from 'react';

import {
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
import { columns } from "@/table-columns-def/food-summary-columns"
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { useFoodItemQuantity, useDeleteFoodItem } from "@/api/hooks";
import { getApiErrorMessage } from "@/lib/api-errors";

interface FoodSummaryProps {
    onEditFoodItem: (id: number) => void;
    onOpenFoodItemDialog: (isOpen: boolean) => void;
    foodItemIdFilter: number;
    onViewDetail: (id: number) => void;
}

export function FoodSummary({ onEditFoodItem, onOpenFoodItemDialog, foodItemIdFilter, onViewDetail }: FoodSummaryProps) {
    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'name', desc: false }])

    const { data: foods = [], isLoading } = useFoodItemQuantity();

    const deleteMutation = useDeleteFoodItem();

    const deleteFoodItem = (id: number) => {
        deleteMutation.mutate(id, {
            onSuccess: () => toast('Item eliminado'),
            onError: (error) => toast.error('Error al eliminar el item: ' + getApiErrorMessage(error)),
        });
    };

    const filteredFoods = React.useMemo(() =>
        foodItemIdFilter === 0 ? foods : foods.filter(f => f.id === foodItemIdFilter),
        [foods, foodItemIdFilter]
    );

    const table = useTable({
        features: tableFeaturesConfig,
        data: filteredFoods,
        columns,
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        meta: {
            deleteFoodItem,
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
    )
}