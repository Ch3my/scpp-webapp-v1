import { FoodTransaction } from "@/models/FoodTransaction"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Skull, ArrowUp, ArrowDown, ArrowUpDown, Trash, FilePenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
        return <Skull size={24} />
    } else {
        return
    }
}

export const columns: ColumnDef<FoodTransaction>[] = [
    // {
    //     accessorKey: "occurredAt",
    //     header: "Fecha",
    //     cell: ({ row }) => {
    //         return row.original.occurredAt.toFormat("dd-MM-yyyy");
    //     }
    // },
    {
        accessorKey: "bestBefore",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Vencimiento
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
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
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            )
        },
    },
    {
        accessorKey: "code",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Cod
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
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
            return accionMapping[row.original.transactionType];
        }
    },
    {
        accessorKey: "changeQty",
        header: () => <div className="text-right">Cant</div>,
        cell: ({ row }) => {
            return <div className="text-right">{row.original.changeQty}</div>
        }
    },
    {
        accessorKey: "remainingQuantity",
        header: () => <div className="text-right">Remnte</div>,
        cell: ({ row }) => {
            return <div className="text-right">{row.original.remainingQuantity}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const { onTransactionDeleted, onTransactionEdit } = table.options.meta as any;
            const [dialogOpen, setDialogOpen] = useState(false);
            const [dropdownOpen, setDropdownOpen] = useState(false);
            return (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                        onTransactionEdit?.(row.original.id)
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <FilePenLine />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash />
                                    Eliminar
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                            >
                                ID: {row.original.id}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                            >
                                R-ID: {row.original.fkTransaction}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={() => {
                                onTransactionDeleted?.(row.original.id);
                                setDialogOpen(false);
                                setDropdownOpen(false);
                            }}>
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )
        },
    },
]