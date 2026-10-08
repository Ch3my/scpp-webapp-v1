import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLogout } from "@/api/hooks"
import { getApiErrorMessage } from "@/lib/api-errors"
import { useAppState, type LayoutOverride } from "@/AppState"

function Htas() {
    let navigate = useNavigate();
    const logout = useLogout();
    const layoutOverride = useAppState((state) => state.layoutOverride);
    const setLayoutOverride = useAppState((state) => state.setLayoutOverride);

    const handleLogout = () => {
        logout.mutate(undefined, {
            onError: (error) => {
                // The session is cleared locally either way, so this is a
                // notice rather than a failure the user has to act on.
                toast("Sesion cerrada localmente", {
                    description: getApiErrorMessage(error),
                });
            },
            onSettled: () => navigate("/login"),
        });
    };

    return (
        <div className="flex justify-center items-center h-screen w-screen">

            <Card className="w-87.5">
                <CardHeader>
                    <CardTitle>Opciones</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="layout">Layout</Label>
                        <Select
                            value={layoutOverride}
                            onValueChange={(value) => setLayoutOverride(value as LayoutOverride)}
                        >
                            <SelectTrigger id="layout">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="auto">Automatico</SelectItem>
                                    <SelectItem value="desktop">Escritorio</SelectItem>
                                    <SelectItem value="mobile">Movil</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Automatico sigue el ancho de la pantalla.
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} disabled={logout.isPending}>
                        {logout.isPending ? "Saliendo..." : "Salir"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default Htas;
