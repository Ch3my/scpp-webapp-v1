import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
import { useChangePassword } from "@/api/hooks"
import { getApiErrorMessage } from "@/lib/api-errors"

const MIN_PASSWORD = 8

/**
 * Settings -> Cambiar contraseña, for everyone. This is how a miembro replaces the
 * starting password their admin gave them. The server keeps this session and signs
 * out every other one.
 */
export function ChangePasswordCard() {
    const change = useChangePassword()
    const [actual, setActual] = useState("")
    const [nueva, setNueva] = useState("")
    const [repetir, setRepetir] = useState("")

    const mismatch = repetir.length > 0 && nueva !== repetir
    const canSubmit = actual.length > 0 && nueva.length >= MIN_PASSWORD && nueva === repetir && !change.isPending

    const submit = () => {
        change.mutate(
            { actual, nueva },
            {
                onSuccess: () => {
                    toast("Contraseña actualizada", { description: "Tus otras sesiones se cerraron." })
                    setActual("")
                    setNueva("")
                    setRepetir("")
                },
                onError: (error) => toast("No se pudo cambiar", { description: getApiErrorMessage(error) }),
            }
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Cambiar contraseña</CardTitle>
                <CardDescription>Al menos {MIN_PASSWORD} caracteres.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (canSubmit) submit()
                    }}
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="pw-actual">Contraseña actual</Label>
                        <Input
                            id="pw-actual"
                            type="password"
                            autoComplete="current-password"
                            value={actual}
                            onChange={(e) => setActual(e.target.value)}
                            className="text-base sm:text-sm"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="pw-nueva">Nueva contraseña</Label>
                        <Input
                            id="pw-nueva"
                            type="password"
                            autoComplete="new-password"
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            className="text-base sm:text-sm"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="pw-repetir">Repetir nueva contraseña</Label>
                        <Input
                            id="pw-repetir"
                            type="password"
                            autoComplete="new-password"
                            value={repetir}
                            onChange={(e) => setRepetir(e.target.value)}
                            aria-invalid={mismatch}
                            className="text-base sm:text-sm"
                        />
                        {mismatch && <p className="text-xs text-destructive">No coinciden.</p>}
                    </div>
                    <Button type="submit" disabled={!canSubmit}>
                        {change.isPending && <Loader2 className="animate-spin" />}
                        Cambiar
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
