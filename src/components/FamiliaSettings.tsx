import { useState } from "react"
import { Check, KeyRound, Loader2, Pencil, Plus, X } from "lucide-react"
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
import { AccesoDialog } from "@/components/AccesoDialog"

/**
 * Settings -> Familia: the people a gasto can be "para". Admin only; the server
 * refuses writes from anyone else regardless.
 *
 * People are added without a login (kids, say); the key button gives one, or manages
 * an existing one. Deactivating hides someone from the pickers, and ends their login,
 * without touching the gastos already labelled with them.
 */
export function FamiliaSettings({ className }: { className?: string }) {
    const { data: me } = useMe()
    const isAdmin = me?.rol === "admin"
    const { data: miembros = [], isLoading } = useMiembros(true)
    const save = useSaveMiembro()

    const [nuevo, setNuevo] = useState("")
    const [editing, setEditing] = useState<{ id: number; nombre: string; abreviatura: string } | null>(null)
    const [accesoFor, setAccesoFor] = useState<Miembro | null>(null)

    if (!isAdmin) return null

    const onError = (error: unknown) => toast("No se pudo guardar", { description: getApiErrorMessage(error) })

    const add = () => {
        const nombre = nuevo.trim()
        if (!nombre) return
        save.mutate({ nombre }, { onSuccess: () => setNuevo(""), onError })
    }

    const update = (m: Miembro, changes: { nombre?: string; activo?: boolean; abreviatura?: string }) => {
        save.mutate(
            {
                id: m.id,
                nombre: changes.nombre ?? m.nombre,
                activo: changes.activo ?? m.activo,
                orden: m.orden,
                // '' clears it back to the one derived from the name; omitted keeps it
                ...(changes.abreviatura !== undefined ? { abreviatura: changes.abreviatura } : {}),
            },
            { onSuccess: () => setEditing(null), onError }
        )
    }

    const saveEditing = (m: Miembro) => {
        if (!editing || !editing.nombre.trim()) return
        update(m, { nombre: editing.nombre.trim(), abreviatura: editing.abreviatura.trim() })
    }

    return (
        <Card className={cn("w-full", className)}>
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
                                            aria-label="Nombre"
                                            value={editing.nombre}
                                            onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEditing(m)
                                                if (e.key === "Escape") setEditing(null)
                                            }}
                                            className="h-9 min-w-0 flex-1"
                                        />
                                        <Input
                                            aria-label="Abreviatura"
                                            title="Abreviatura (3 letras). Vacia = se deriva del nombre"
                                            // The derived one as placeholder, so an empty field shows what will be used
                                            placeholder={m.abreviaturaPropia ? undefined : m.abreviatura}
                                            maxLength={3}
                                            value={editing.abreviatura}
                                            onChange={(e) => setEditing({ ...editing, abreviatura: e.target.value.toUpperCase() })}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEditing(m)
                                                if (e.key === "Escape") setEditing(null)
                                            }}
                                            className="h-9 w-16 shrink-0 text-center font-mono uppercase"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label="Guardar"
                                            disabled={!editing.nombre.trim() || save.isPending}
                                            onClick={() => saveEditing(m)}
                                        >
                                            <Check />
                                        </Button>
                                        <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(null)}>
                                            <X />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Badge
                                            variant="outline"
                                            title={m.abreviaturaPropia ? "Abreviatura" : "Abreviatura (derivada del nombre)"}
                                            className={cn("w-11 shrink-0 justify-center font-mono font-normal", !m.abreviaturaPropia && "text-muted-foreground")}
                                        >
                                            {m.abreviatura}
                                        </Badge>
                                        <span className={cn("min-w-0 flex-1 truncate", !m.activo && "text-muted-foreground line-through")}>
                                            {m.nombre}
                                        </span>
                                        {m.tieneLogin && !m.puedeIngresar && <Badge variant="outline">Sin acceso</Badge>}
                                        {m.tieneLogin && m.puedeIngresar && m.rol === "admin" && <Badge variant="secondary">Admin</Badge>}
                                        {m.tieneLogin && m.puedeIngresar && m.rol !== "admin" && <Badge variant="outline">Con login</Badge>}
                                        {/* Your own access is changed from your password card, never here */}
                                        {!isSelf && m.activo && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={m.tieneLogin ? `Acceso de ${m.nombre}` : `Dar acceso a ${m.nombre}`}
                                                title={m.tieneLogin ? "Administrar acceso" : "Dar acceso"}
                                                onClick={() => setAccesoFor(m)}
                                            >
                                                <KeyRound className={cn(!m.tieneLogin && "opacity-50")} />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={`Editar ${m.nombre}`}
                                            onClick={() => setEditing({ id: m.id, nombre: m.nombre, abreviatura: m.abreviaturaPropia ?? "" })}
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
            <AccesoDialog miembro={accesoFor} onOpenChange={(open) => !open && setAccesoFor(null)} />
        </Card>
    )
}
