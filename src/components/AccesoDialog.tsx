import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/responsive-dialog"
import { useSaveAcceso } from "@/api/hooks"
import { getApiErrorMessage } from "@/lib/api-errors"
import type { Miembro } from "@/models/Miembro"

const MIN_PASSWORD = 8

type Rol = "admin" | "miembro"

interface AccesoDialogProps {
    miembro: Miembro | null
    onOpenChange: (open: boolean) => void
}

/**
 * Admin: give a miembro a login, or manage the one they have (role, access on/off,
 * password reset). The admin chooses the starting password and tells the person,
 * who can change it from Settings.
 */
export function AccesoDialog({ miembro, onOpenChange }: AccesoDialogProps) {
    const save = useSaveAcceso()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rol, setRol] = useState<Rol>("miembro")
    const [puedeIngresar, setPuedeIngresar] = useState(true)

    // Reset the form for whichever miembro the dialog opens on
    useEffect(() => {
        if (!miembro) return
        setEmail("")
        setPassword("")
        setRol(miembro.rol ?? "miembro")
        setPuedeIngresar(miembro.tieneLogin ? miembro.puedeIngresar : true)
    }, [miembro])

    if (!miembro) return null

    const isGrant = !miembro.tieneLogin
    const passwordOk = password.length === 0 ? !isGrant : password.length >= MIN_PASSWORD
    const emailOk = !isGrant || /^\S+@\S+\.\S+$/.test(email.trim())
    const changed =
        isGrant || password.length > 0 || rol !== miembro.rol || puedeIngresar !== miembro.puedeIngresar

    const close = () => onOpenChange(false)
    const onError = (error: unknown) => toast("No se pudo guardar", { description: getApiErrorMessage(error) })

    const submit = () => {
        if (isGrant) {
            save.mutate(
                { grant: { id: miembro.id, emailAddress: email.trim(), password, rol } },
                {
                    onSuccess: () => {
                        toast("Acceso creado", { description: `${miembro.nombre} ya puede ingresar con ${email.trim()}` })
                        close()
                    },
                    onError,
                }
            )
            return
        }
        save.mutate(
            {
                update: {
                    id: miembro.id,
                    ...(rol !== miembro.rol ? { rol } : {}),
                    ...(puedeIngresar !== miembro.puedeIngresar ? { puedeIngresar } : {}),
                    ...(password ? { password } : {}),
                },
            },
            {
                onSuccess: () => {
                    toast("Acceso actualizado")
                    close()
                },
                onError,
            }
        )
    }

    return (
        <Dialog open={!!miembro} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isGrant ? `Dar acceso a ${miembro.nombre}` : `Acceso de ${miembro.nombre}`}</DialogTitle>
                    <DialogDescription>
                        {isGrant
                            ? "Elige su email y una contraseña inicial, y compártela con la persona. Podrá cambiarla en Opciones."
                            : miembro.emailAddress}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {isGrant && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="acceso-email">Email</Label>
                            <Input
                                id="acceso-email"
                                type="email"
                                autoComplete="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-base sm:text-sm"
                            />
                        </div>
                    )}

                    <div className="grid gap-1.5">
                        <Label htmlFor="acceso-password">
                            {isGrant ? "Contraseña inicial" : "Nueva contraseña"}
                            {!isGrant && <span className="font-normal text-muted-foreground"> (opcional)</span>}
                        </Label>
                        <Input
                            id="acceso-password"
                            type="text"
                            autoComplete="off"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-base sm:text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Al menos {MIN_PASSWORD} caracteres.
                            {!isGrant && " Cambiarla cierra sus sesiones abiertas."}
                        </p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Rol</Label>
                        <Select value={rol} onValueChange={(v) => setRol(v as Rol)}>
                            <SelectTrigger className="min-h-11 sm:min-h-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="miembro">Miembro: ve sus propios gastos</SelectItem>
                                <SelectItem value="admin">Admin: ve y administra toda la familia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!isGrant && (
                        <div className="flex min-h-11 items-center justify-between gap-3">
                            <div>
                                <Label htmlFor="acceso-activo">Puede ingresar</Label>
                                <p className="text-xs text-muted-foreground">
                                    Desactivarlo cierra sus sesiones; sus gastos se mantienen.
                                </p>
                            </div>
                            <Switch id="acceso-activo" checked={puedeIngresar} onCheckedChange={setPuedeIngresar} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={close}>Cancelar</Button>
                    <Button onClick={submit} disabled={!changed || !passwordOk || !emailOk || save.isPending}>
                        {save.isPending && <Loader2 className="animate-spin" />}
                        {isGrant ? "Dar acceso" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
