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
import { Link } from "react-router"

export default function Config() {
    const { sessionId, apiPrefix, setApiPrefix, setSessionId } = useAppState()
    
    const [localApiPrefix, setLocalApiPrefix] = useState<string>(apiPrefix);
    const [localSessionId, setLocalSessionId] = useState<string>(sessionId);

    const saveConfig = () => {
        setApiPrefix(localApiPrefix)
        setSessionId(localSessionId)

        localStorage.setItem("apiPrefix", localApiPrefix)
        localStorage.setItem("sessionId", localSessionId)

        toast("Guardado Correctamemnte")
    }

    return (
        <div className="items-center justify-center w-screen h-screen flex">
            <Card className="w-[500px]">
                <CardHeader>
                    <CardTitle>Configuracion</CardTitle>
                    <CardDescription>Debe existir un API endpoint valido</CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="apiPrefix">Api Prefix</Label>
                                <Input id="apiPrefix" onChange={e => setLocalApiPrefix(e.target.value)} value={localApiPrefix} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="sessionId">SessionId</Label>
                                <Input id="sessionId" onChange={e => setLocalSessionId(e.target.value)} />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link to="/login">Login</Link>
                    </Button>
                    <Button className="block" onClick={() => saveConfig()}>Guardar</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
