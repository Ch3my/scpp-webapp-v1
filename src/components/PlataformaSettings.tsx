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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-errors"
import { useFamiliasAdmin, useMe, useSaveFamilia } from "@/api/hooks"

const MIN_PASSWORD = 8

const emptyForm = { familia: "", nombre: "", email: "", password: "" }

/**
 * Settings -> Plataforma: families on this deployment, for super-admins only.
 *
 * Creating a family creates its first admin too; from then on that admin manages the
 * family themselves (Settings -> Familia). This card shows counts and admins only -
 * the server never hands a super-admin another family's gastos.
 */
export function PlataformaSettings({ className }: { className?: string }) {
    const { data: me } = useMe()
    const isSuperAdmin = me?.isSuperAdmin === true
    const { data: familias = [], isLoading } = useFamiliasAdmin(isSuperAdmin)
    const save = useSaveFamilia()

    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editing, setEditing] = useState<{ id: number; nombre: string } | null>(null)

    if (!isSuperAdmin) return null

    const onError = (error: unknown) => toast("No se pudo guardar", { description: getApiErrorMessage(error) })

    const formOk =
        form.familia.trim() !== "" &&
        form.nombre.trim() !== "" &&
        /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
        form.password.length >= MIN_PASSWORD

    const create = () => {
        save.mutate(
            {
                nombre: form.familia.trim(),
                admin: { nombre: form.nombre.trim(), emailAddress: form.email.trim(), password: form.password },
            },
            {
                onSuccess: () => {
                    toast("Familia creada", {
                        description: `${form.nombre.trim()} ya puede ingresar con ${form.email.trim()}`,
                    })
                    setForm(emptyForm)
                    setCreating(false)
                },
                onError,
            }
        )
    }

    const rename = () => {
        if (!editing?.nombre.trim()) return
        save.mutate({ id: editing.id, nombre: editing.nombre.trim() }, { onSuccess: () => setEditing(null), onError })
    }

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Plataforma</CardTitle>
                <CardDescription>Familias en este servidor. Cada una administra sus propios datos.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {isLoading && <Loader2 className="mx-auto animate-spin opacity-60" />}

                <ul className="flex flex-col divide-y">
                    {familias.map((f) => {
                        const isEditing = editing?.id === f.id
                        return (
                            <li key={f.id} className="flex min-h-11 flex-col gap-1 py-2">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <Input
                                                autoFocus
                                                aria-label="Nombre de la familia"
                                                value={editing.nombre}
                                                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") rename()
                                                    if (e.key === "Escape") setEditing(null)
                                                }}
                                                className="h-9 min-w-0 flex-1"
                                            />
                                            <Button size="icon" variant="ghost" aria-label="Guardar" disabled={!editing.nombre.trim() || save.isPending} onClick={rename}>
                                                <Check />
                                            </Button>
                                            <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(null)}>
                                                <X />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="min-w-0 flex-1 truncate font-medium">{f.nombre}</span>
                                            {f.id === me?.familia.id && <Badge variant="secondary">Tu familia</Badge>}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Renombrar ${f.nombre}`}
                                                onClick={() => setEditing({ id: f.id, nombre: f.nombre })}
                                            >
                                                <Pencil />
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {f.miembros} {f.miembros === 1 ? "persona" : "personas"} · {f.logins}{" "}
                                    con acceso
                                    {f.admins.length > 0 && (
                                        <> · Admin: {f.admins.map((a) => a.emailAddress ?? a.nombre).join(", ")}</>
                                    )}
                                </p>
                            </li>
                        )
                    })}
                </ul>

                {creating ? (
                    <form
                        className="grid gap-3 rounded-lg border p-3"
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (formOk && !save.isPending) create()
                        }}
                    >
                        <div className="grid gap-1.5">
                            <Label htmlFor="nf-familia">Nombre de la familia</Label>
                            <Input id="nf-familia" value={form.familia} onChange={(e) => setForm({ ...form, familia: e.target.value })} className="text-base sm:text-sm" />
                        </div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Primer administrador</p>
                        <div className="grid gap-1.5">
                            <Label htmlFor="nf-nombre">Nombre</Label>
                            <Input id="nf-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="text-base sm:text-sm" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="nf-email">Email</Label>
                            <Input id="nf-email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-base sm:text-sm" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="nf-password">Contraseña inicial</Label>
                            {/* Visible on purpose: you hand it to the new admin, who changes it in Opciones */}
                            <Input id="nf-password" type="text" autoComplete="off" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="text-base sm:text-sm" />
                            <p className="text-xs text-muted-foreground">Al menos {MIN_PASSWORD} caracteres. Compártela con el administrador.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => { setCreating(false); setForm(emptyForm) }}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={!formOk || save.isPending}>
                                {save.isPending && <Loader2 className="animate-spin" />}
                                Crear familia
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button variant="outline" onClick={() => setCreating(true)}>
                        <Plus />
                        Nueva familia
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
