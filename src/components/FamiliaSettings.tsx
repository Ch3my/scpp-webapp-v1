import { useState } from "react"
import { Check, Loader2, Pencil, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-errors"
import { useMe, useMiembros, useSaveMiembro } from "@/api/hooks"
import type { Miembro } from "@/models/Miembro"

/**
 * Settings -> Familia: the people a gasto can be "para". Admin only; the server
 * refuses writes from anyone else regardless.
 *
 * People added here have no login (kids, say). Deactivating hides someone from the
 * pickers without touching the gastos already labelled with them.
 */
export function FamiliaSettings() {
    const { data: me } = useMe()
    const isAdmin = me?.rol === "admin"
    const { data: miembros = [], isLoading } = useMiembros(true)
    const save = useSaveMiembro()

    const [nuevo, setNuevo] = useState("")
    const [editing, setEditing] = useState<{ id: number; nombre: string } | null>(null)

    if (!isAdmin) return null

    const onError = (error: unknown) => toast("No se pudo guardar", { description: getApiErrorMessage(error) })

    const add = () => {
        const nombre = nuevo.trim()
        if (!nombre) return
        save.mutate({ nombre }, { onSuccess: () => setNuevo(""), onError })
    }

    const update = (m: Miembro, changes: Partial<Pick<Miembro, "nombre" | "activo">>) => {
        save.mutate(
            { id: m.id, nombre: changes.nombre ?? m.nombre, activo: changes.activo ?? m.activo, orden: m.orden },
            { onSuccess: () => setEditing(null), onError }
        )
    }

    return (
        <Card className="w-full max-w-87.5">
            <CardHeader>
                <CardTitle>Familia</CardTitle>
                <CardDescription>
                    {me?.familia.nombre}: personas a las que se puede asignar un gasto.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {isLoading && <Loader2 className="mx-auto animate-spin opacity-60" />}

                <ul className="flex flex-col divide-y">
                    {miembros.map((m) => {
                        const isSelf = m.id === me?.miembro.id
                        const isEditing = editing?.id === m.id
                        return (
                            <li key={m.id} className="flex min-h-11 items-center gap-2 py-1.5">
                                {isEditing ? (
                                    <>
                                        <Input
                                            autoFocus
                                            value={editing.nombre}
                                            onChange={(e) => setEditing({ id: m.id, nombre: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && editing.nombre.trim()) update(m, { nombre: editing.nombre.trim() })
                                                if (e.key === "Escape") setEditing(null)
                                            }}
                                            className="h-9 flex-1"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label="Guardar"
                                            disabled={!editing.nombre.trim() || save.isPending}
                                            onClick={() => update(m, { nombre: editing.nombre.trim() })}
                                        >
                                            <Check />
                                        </Button>
                                        <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(null)}>
                                            <X />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className={cn("min-w-0 flex-1 truncate", !m.activo && "text-muted-foreground line-through")}>
                                            {m.nombre}
                                        </span>
                                        {m.rol === "admin" && <Badge variant="secondary">Admin</Badge>}
                                        {m.tieneLogin && m.rol !== "admin" && <Badge variant="outline">Con login</Badge>}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={`Renombrar ${m.nombre}`}
                                            onClick={() => setEditing({ id: m.id, nombre: m.nombre })}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Switch
                                            checked={m.activo}
                                            // You cannot deactivate yourself: login needs an active miembro
                                            disabled={isSelf || save.isPending}
                                            aria-label={m.activo ? `Desactivar ${m.nombre}` : `Activar ${m.nombre}`}
                                            onCheckedChange={(activo) => update(m, { activo })}
                                        />
                                    </>
                                )}
                            </li>
                        )
                    })}
                </ul>

                <div className="flex gap-2">
                    <Input
                        placeholder="Agregar persona"
                        value={nuevo}
                        onChange={(e) => setNuevo(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && add()}
                        className="flex-1"
                    />
                    <Button onClick={add} disabled={!nuevo.trim() || save.isPending} aria-label="Agregar">
                        {save.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
