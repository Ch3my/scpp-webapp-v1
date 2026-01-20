import { FoodTransaction } from "@/models/FoodTransaction"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Skull, ArrowUp, ArrowDown, ArrowUpDown, Trash, FilePenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DateTime } from "luxon"
import { useState } from "react"
import numeral from "numeral"

const accionMapping: { [key: string]: string } = {
    "consumption": "Consumo",
    "adjustment": "Ajuste",
    "restock": "Reposición",
}

const calculateIcon = (bestBefore: DateTime | null) => {
    if (!bestBefore) {
        return
    }
    const today = DateTime.now()
    const diff = bestBefore.diff(today, ['days']).days
    if (diff < 60) {
        return <Skull size={20} />
    } else {
        return
    }
}

export const columns: ColumnDef<FoodTransaction>[] = [
    {
        accessorKey: "bestBefore",
        size: 90,
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Vencimiento
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                </Button>
            )
        },
        cell: ({ row }) => {
            return row.original.bestBefore?.toFormat("dd-MM-yyyy");
        },
        sortingFn: (rowA, rowB, _) => {
            const dateA = rowA.original.bestBefore;
            const dateB = rowB.original.bestBefore;
            if (!dateA) return -1;
            if (!dateB) return 1;
            return dateA.toMillis() - dateB.toMillis();
        }
    },
    {
        id: "icon",
        size: 25,
        cell: ({ row }) => {
            return calculateIcon(row.original.bestBefore);
        }
    },
    {
        accessorKey: "food.name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                </Button>
            )
        },
    },
    {
        accessorKey: "code",
        header: ({ column }) => {
            return (
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Cod
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-1 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-1 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                    </Button>
                </div>
            )
        },
        cell: ({ row }) => {
            return (
                <div className="text-center">
                    {!row.original.code ? (
                        <Badge variant="outline" className="bg-slate-500 dark:bg-slate-700" >N/A</Badge>
                    ) : (
                        <Badge variant="outline" className="bg-orange-500  dark:bg-orange-900 " >{row.original.code}</Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "food.unit",
        header: "Und"
    },
    {
        accessorKey: "transactionType",
        header: "Tipo",
        cell: ({ row }) => {
            return <Badge variant="outline" className="bg-slate-800">{accionMapping[row.original.transactionType]}</Badge>;
        }
    },
    {
        accessorKey: "changeQty",
        header: () => <div className="text-right">Cant</div>,
        cell: ({ row }) => {
            return <div className="text-right">{numeral(row.original.changeQty).format("0,0")}</div>
        }
    },
    {
        accessorKey: "remainingQuantity",
        header: () => <div className="text-right">Remnte</div>,
        cell: ({ row }) => {
            return <div className="text-right">{numeral(row.original.remainingQuantity).format("0,0")}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const { onTransactionDeleted, onTransactionEdit } = table.options.meta as any;
            const [dialogOpen, setDialogOpen] = useState(false);
            const [dropdownOpen, setDropdownOpen] = useState(false);

            const handleDelete = () => {
                onTransactionDeleted?.(row.original.id);
                setDialogOpen(false);
                setDropdownOpen(false);
            };

            const handleDeleteClick = () => {
                setDropdownOpen(false); // Close dropdown first
                setDialogOpen(true); // Then open dialog
            };

            return (
                <>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-4 w-6 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {row.original.transactionType === "restock" && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        onTransactionEdit?.(row.original)
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <FilePenLine />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleDeleteClick}>
                                <Trash />
                                Eliminar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                ID: {row.original.id}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                R-ID: {row.original.fkTransaction}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirmar eliminación</DialogTitle>
                                <DialogDescription>
                                    ¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleDelete}>
                                    Eliminar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )
        },
    },
]