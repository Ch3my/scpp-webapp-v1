import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppState } from "@/AppState"
import { Link, useNavigate } from "react-router"
import { useLogin } from "@/api/hooks"
import { getApiErrorMessage } from "@/lib/api-errors"

export default function Login() {
    const [user, setUser] = useState<string>("");
    const [pass, setPass] = useState<string>("");
    let navigate = useNavigate();
    const { setSessionId, setLoggedIn } = useAppState()
    const loginMutation = useLogin()

    const login = async () => {
        if (!user || !pass) {
            toast("Ingresa Datos")
            return
        }

        try {
            const response = await loginMutation.mutateAsync({ username: user, password: pass })

            setSessionId(response.sessionHash)
            setLoggedIn(true)

            // The lookup tables the next screen needs are plain queries now
            // (api/hooks/useLookups.ts), so they load with it instead of
            // holding the navigation behind two more round-trips.
            navigate("/dashboard")
        } catch (error) {
            toast("Error al Iniciar Sesion", { description: getApiErrorMessage(error) })
        }
    }

    // Without this the form reloads the page on Enter / the phone keyboard's Go
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        login()
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-4">
            <Card className="w-full max-w-125">
                <CardHeader>
                    <CardTitle>Iniciar Sesion</CardTitle>
                    <CardDescription>En sistema de control de presupuestos personales</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Usuario</Label>
                                <Input id="name" autoComplete="username" onChange={e => setUser(e.target.value)} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" autoComplete="current-password" onChange={e => setPass(e.target.value)} />
                            </div>
                        </div>
                        {/* Submits on Enter without taking visual space */}
                        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link to="/config">Config</Link>
                    </Button>
                    <Button onClick={() => login()} disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
