
import { Food } from "@/models/Food"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<Food>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "quantity",
        header: () => <div className="text-right">Cant</div>,
        cell: ({ row }) => {
            return <div className="text-right">{row.original.quantity}</div>
        }
    },
    {
        accessorKey: "unit",
        header: "Und"
    },
    {
        accessorKey: "lastTransactionAt",
        header: () => <div className="w-20">Actividad</div>,
        cell: ({ row }) => {
            return row.original.lastTransactionAt?.toFormat("dd-MM-yyyy");
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const { deleteFoodItem, editFoodItem } = table.options.meta as any;
            return (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-4 w-6 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => {
                                editFoodItem(row.original.id)
                            }}
                        >
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                deleteFoodItem(row.original.id)
                            }}
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
