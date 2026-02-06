import { useAppState } from "@/AppState";
import { Button } from "@/components/ui/button"
import api from "@/lib/api";
import { useNavigate } from "react-router"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

function Htas() {
    const { setLoggedIn, setSessionId } = useAppState();
    let navigate = useNavigate();

    const logout = async () => {
        try {
            await api.post("/login")

            // TODO Check Error
            setLoggedIn(false)
            setSessionId("")
            navigate("/login")
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex justify-center items-center h-screen w-screen">

            <Card className="w-87.5">
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

export default Htas;
