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
import { columns } from "@/table-columns-def/food-screen-columns"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { toast } from 'sonner';

interface FoodScreenTableProps {
    apiPrefix: string;
    sessionId: string;
    onEditFoodItem: (id: number) => void;
    onOpenFoodItemDialog: (isOpen: boolean) => void;
}

export function FoodScreenTable({ apiPrefix, sessionId, onEditFoodItem, onOpenFoodItemDialog }: FoodScreenTableProps) {
    const queryClient = useQueryClient();
    const [sorting, setSorting] = React.useState<SortingState>([])

    const { data: foods = [] } = useQuery<Food[]>({
        queryKey: ['foods'],
        queryFn: async () => {
            let params = new URLSearchParams();
            params.set("sessionHash", sessionId);

            let response = await fetch(`${apiPrefix}/food/item-quantity?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let apiData: any[] = await response.json();

            const transformedData = apiData.map(item => ({
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
            const response = await fetch(`${apiPrefix}/food/item`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionHash: sessionId, id: id }),

            });
            const data = await response.json();
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

    const table = useReactTable({
        data: foods,
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
            }
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
                    {table.getRowModel().rows?.length ? (
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