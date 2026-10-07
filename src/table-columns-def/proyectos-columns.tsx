import { Proyecto } from "@/models/Proyecto"
import { ColumnDef } from "@tanstack/react-table"
import { tableFeaturesConfig } from "@/lib/table-features"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<typeof tableFeaturesConfig, Proyecto>[] = [
    {
        accessorKey: "nombre",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Proyecto
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "activo",
        header: "Estado",
        cell: ({ row }) => {
            return row.original.activo
                ? <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/20">Activo</Badge>
                : <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">Inactivo</Badge>
        }
    },
    {
        id: "actions",
        meta: { className: "p-0" },
        cell: ({ row, table }) => {
            const { editProyecto, deleteProyecto } = table.options.meta as any;
            return (
                // The row itself is clickable (it selects the proyecto), so the actions
                // cell must not bubble its clicks up into the selection handler.
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-8 p-0 flex items-center justify-center">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    editProyecto(row.original)
                                }}
                            >
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    deleteProyecto(row.original)
                                }}
                            >
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
