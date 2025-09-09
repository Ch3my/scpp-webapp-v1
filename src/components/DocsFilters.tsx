import * as React from "react"
import { DateTime } from "luxon"
import { useAppState } from "@/AppState"
import { Button } from "@/components/ui/button"
import { Filter } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { DatePicker } from "./DatePicker";
import { Checkbox } from "./ui/checkbox";

interface FilterDialogProps {
    // Parent passes in Luxon `DateTime` objects
    fechaInicio: DateTime
    fechaTermino: DateTime

    // `categoria` is an integer
    categoria: number

    // `searchPhrase` is a string
    searchPhrase: string

    searchPhraseIgnoreOtherFilters: boolean

    // Emitted back to parent when user clicks "OK"
    onFiltersChange: (filters: {
        fechaInicio: DateTime
        fechaTermino: DateTime
        categoria: number
        searchPhrase: string
        searchPhraseIgnoreOtherFilters: boolean
    }) => void
}

export function DocsFilters({
    fechaInicio,
    fechaTermino,
    categoria,
    searchPhrase,
    searchPhraseIgnoreOtherFilters,
    onFiltersChange,
}: FilterDialogProps) {
    const [open, setOpen] = React.useState(false)
    const { categorias } = useAppState()
    const [localFechaInicio, setLocalFechaInicio] = React.useState<DateTime>(fechaInicio)
    const [localFechaTermino, setLocalFechaTermino] = React.useState<DateTime>(fechaTermino)
    const [localCategoria, setLocalCategoria] = React.useState<number>(categoria)
    const [localSearchPhrase, setLocalSearchPhrase] = React.useState<string>(searchPhrase)
    const [localSearchPhraseIgnoreOtherFilters, setLocalSearchPhraseIgnoreOtherFilters] = React.useState<boolean>(true)

    // Keep local state in sync if the parent props change
    React.useEffect(() => {
        setLocalFechaInicio(fechaInicio)
    }, [fechaInicio])

    React.useEffect(() => {
        setLocalFechaTermino(fechaTermino)
    }, [fechaTermino])

    React.useEffect(() => {
        setLocalCategoria(categoria)
    }, [categoria])

    React.useEffect(() => {
        setLocalSearchPhrase(searchPhrase)
    }, [searchPhrase])

    React.useEffect(() => {
        setLocalSearchPhraseIgnoreOtherFilters(searchPhraseIgnoreOtherFilters)
    }, [searchPhraseIgnoreOtherFilters])

    const handleOk = () => {
        onFiltersChange({
            fechaInicio: localFechaInicio,
            fechaTermino: localFechaTermino,
            categoria: localCategoria,
            searchPhrase: localSearchPhrase,
            searchPhraseIgnoreOtherFilters: localSearchPhraseIgnoreOtherFilters
        })
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Filter />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filtros</DialogTitle>
                    <DialogDescription>
                        Actualiza y presiona Ok para actualizar los resultados
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 items-center" style={{ gridTemplateColumns: "1fr 3fr" }}>
                    <Label htmlFor="search-phrase">
                        Buscar
                    </Label>
                    <div>
                        <Input
                            id="search-phrase"
                            placeholder="Palabras clave..."
                            value={localSearchPhrase}
                            onChange={(e) => setLocalSearchPhrase(e.target.value)}
                            className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                            <Checkbox checked={localSearchPhraseIgnoreOtherFilters} onCheckedChange={(o) => setLocalSearchPhraseIgnoreOtherFilters(Boolean(o))} />
                            <p className="text-muted-foreground text-sm">Ignora otros Filtros</p>
                        </div>
                    </div>
                    <Label htmlFor="fecha-inicio">
                        Fecha Inicio
                    </Label>
                    <DatePicker
                        value={localFechaInicio}
                        onChange={(e) => e && setLocalFechaInicio(e)}
                    />

                    <Label htmlFor="fecha-termino">
                        Fecha Término
                    </Label>
                    <DatePicker
                        value={localFechaTermino}
                        onChange={(e) => e && setLocalFechaTermino(e)}
                    />

                    <Label htmlFor="categoria">
                        Categoría
                    </Label>
                    <Select
                        // The `Select` from shadcn/ui only accepts strings for `value`.
                        // Convert our numeric value to string:
                        value={String(localCategoria)}
                        // Convert back to number in the onValueChange:
                        onValueChange={(val) => setLocalCategoria(Number(val))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            <SelectItem value="0">(Todos)</SelectItem>
                            {categorias.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.descripcion}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Salir
                    </Button>
                    <Button onClick={handleOk}>
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
