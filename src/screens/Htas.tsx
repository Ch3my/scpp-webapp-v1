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
import { cn } from "@/lib/utils"
import { FamiliaSettings } from "@/components/FamiliaSettings"
import { ChangePasswordCard } from "@/components/ChangePasswordCard"
import { PlataformaSettings } from "@/components/PlataformaSettings"
import ScreenTitle from "@/components/ScreenTitle"
import { useLayoutMode } from "@/shell/useLayoutMode"

function Htas() {
    let navigate = useNavigate();
    const logout = useLogout();
    const layoutOverride = useAppState((state) => state.layoutOverride);
    const setLayoutOverride = useAppState((state) => state.setLayoutOverride);
    const isDesktop = useLayoutMode() === "desktop";

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

    // Desktop: tiles - two columns (Familia spanning both, its rows need the width),
    // three side by side on wide screens; items-start keeps each card at its own
    // height. Mobile layout: always one column, whatever the screen width, so a
    // tablet or a forced-mobile desktop reads like the phone does.
    return (
        <div className={cn("mx-auto w-full p-4", isDesktop ? "max-w-6xl sm:p-6" : "max-w-xl")}>
            {/* The mobile shell already titles the screen in its header */}
            {isDesktop && <ScreenTitle title="Opciones" />}
            <div className={cn("mt-2 grid items-start gap-4", isDesktop && "sm:grid-cols-2 xl:grid-cols-3")}>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>Apariencia y sesion en este dispositivo.</CardDescription>
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
            <ChangePasswordCard />
            <FamiliaSettings className={cn(isDesktop && "sm:col-span-2 xl:col-span-1")} />
            {/* Super-admins only; renders nothing for everyone else */}
            <PlataformaSettings className={cn(isDesktop && "sm:col-span-2 xl:col-span-1")} />
            </div>
        </div>
    )
}

export default Htas;
