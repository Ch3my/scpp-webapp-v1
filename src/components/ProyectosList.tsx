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
import { Proyecto } from "@/models/Proyecto"
import { columns } from "@/table-columns-def/proyectos-columns"
import { Skeleton } from './ui/skeleton';

interface ProyectosListProps {
    /** Already filtered and sorted by the screen */
    proyectos: Proyecto[];
    isLoading: boolean;
    selectedProyectoId: number;
    /** Picks the empty-state message */
    isFiltered: boolean;
    onSelect: (id: number) => void;
    onEdit: (proyecto: Proyecto) => void;
    onDelete: (proyecto: Proyecto) => void;
}

export function ProyectosList({
    proyectos,
    isLoading,
    selectedProyectoId,
    isFiltered,
    onSelect,
    onEdit,
    onDelete,
}: ProyectosListProps) {
    // Empty by default: the screen hands over a pre-sorted list. Clicking the
    // Proyecto header then takes over the ordering.
    const [sorting, setSorting] = React.useState<SortingState>([])

    const table = useTable({
        features: tableFeaturesConfig,
        data: proyectos,
        columns,
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        meta: {
            editProyecto: onEdit,
            deleteProyecto: onDelete,
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
                                data-state={row.original.id === selectedProyectoId ? "selected" : undefined}
                                className="cursor-pointer"
                                onClick={() => onSelect(row.original.id)}
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
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                {isFiltered ? 'Sin resultados' : 'Sin proyectos'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
