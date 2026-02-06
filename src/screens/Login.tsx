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
// Para evitar CORS, usa RUST para hacer las request


export default function Login() {
    const [user, setUser] = useState<string>("");
    const [pass, setPass] = useState<string>("");
    let navigate = useNavigate();
    const { apiPrefix, setSessionId, setLoggedIn, fetchCategorias, fetchTipoDocs } = useAppState()

    const login = async () => {
        if (!user || !pass) {
            toast("Ingresa Datos")
            return
        }
        const response = await fetch(`${apiPrefix}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: user, password: pass }),
        }).then(response => response.json())

        if (response.hasErrors) {
            toast("Error al Iniciar Sesion", { description: response.errorDescription[0] })
            return
        }
        setSessionId(response.sessionHash)
        setLoggedIn(true)

        await Promise.all([fetchCategorias(), fetchTipoDocs()]);

        navigate("/dashboard")
    }

    return (
        <div className="items-center justify-center w-screen h-screen flex">
            <Card className="w-125">
                <CardHeader>
                    <CardTitle>Iniciar Sesion</CardTitle>
                    <CardDescription>En sistema de control de presupuestos personales</CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Usuario</Label>
                                <Input id="name" onChange={e => setUser(e.target.value)} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Password</Label>
                                <Input id="password" type="password" onChange={e => setPass(e.target.value)} />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link to="/config">Config</Link>
                    </Button>
                    <Button onClick={() => login()}>Entrar</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
