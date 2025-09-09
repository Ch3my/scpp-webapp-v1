import { useAppState } from "@/AppState";
import { Button } from "@/components/ui/button"

import { useNavigate } from "react-router"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function Htas() {
    const { apiPrefix, sessionId, setLoggedIn, setSessionId } = useAppState();
    let navigate = useNavigate();

    const logout = async () => {
        try {
            await fetch(`${apiPrefix}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionHash: sessionId }),
            }).then(response => response.json())

            // TODO Check Error
            localStorage.removeItem("sessionId")
            localStorage.setItem("isLoggedIn", "false")
            setLoggedIn(false)
            setSessionId("")
            navigate("/login")
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex justify-center items-center h-screen w-screen">

            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Opciones</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button variant="outline" onClick={logout}>Salir</Button>
                </CardContent>
            </Card>
        </div>
    )
}
