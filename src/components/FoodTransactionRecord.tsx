import { Button } from "@/components/ui/button"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CirclePlus, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { DateTime } from "luxon";
import { toast } from "sonner";
import { DatePickerInput } from "./DatePickerInput";
import { ComboboxAlimentos } from "./ComboboxAlimentos";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { FoodTransaction } from "@/models/FoodTransaction";
import { Badge } from "@/components/ui/badge";
import {
    useFoodTransaction,
    useUsedTransactionCodes,
    useSaveFoodTransaction,
} from "@/api/hooks";
import { getApiErrorMessage } from "@/lib/api-errors";

interface Props {
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    hideButton?: boolean;
    /** Pass initial data to avoid fetching - for edit mode with data from parent */
    initialData?: FoodTransaction | null;
}

const FoodTransactionRecord: React.FC<Props> = ({ onOpenChange, isOpen: controlledIsOpen, hideButton, initialData }) => {
    const [codigo, setCodigo] = useState<string>("");
    const [itemId, setItemId] = useState<number>(0);
    const [cantidad, setCantidad] = useState<number>(1);
    const [accion, setAccion] = useState<string>("restock");
    const [notas, setNotas] = useState<string>("");
    const [bestBefore, setBestBefore] = useState<DateTime | undefined>(undefined);
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

    const isEditMode = !!initialData;

    // Fetch fresh data in background to ensure we have latest version
    const { data: freshData } = useFoodTransaction(initialData?.id, isOpen && !!initialData);

    // Use fresh data if available, otherwise use initialData
    const transactionData = freshData ?? initialData;

    // Codigos ya usados, para sugerir el menor numero disponible al crear
    const { data: codigosUsados = [] } = useUsedTransactionCodes(isOpen && !isEditMode);

    const codigoSugerido = useMemo(() => {
        // Si algun codigo tiene letras no se puede sugerir un numero
        if (codigosUsados.some((code) => !/^\d+$/.test(code))) {
            return null;
        }
        const usados = new Set(codigosUsados.map(Number));
        let sugerencia = 1;
        while (usados.has(sugerencia)) {
            sugerencia++;
        }
        // El input acepta maximo 3 caracteres
        return sugerencia <= 999 ? String(sugerencia) : null;
    }, [codigosUsados]);

    useEffect(() => {
        if (isOpen) {
            if (transactionData) {
                setItemId(transactionData.itemId);
                setCantidad(transactionData.changeQty);
                setAccion(transactionData.transactionType);
                // Both are nullable on the wire; these back controlled inputs,
                // so null would flip them to uncontrolled.
                setCodigo(transactionData.code ?? "");
                setNotas(transactionData.note ?? "");
                if (transactionData.bestBefore) {
                    setBestBefore(transactionData.bestBefore);
                }
            } else {
                clearInputs();
            }
        }
    }, [isOpen, transactionData]);

    const mutation = useSaveFoodTransaction();

    const save = (payload: unknown) => {
        mutation.mutate({ payload, isEdit: isEditMode }, {
            onSuccess: () => {
                toast("Transacción guardada")
                handleDialogChange(false);
                clearInputs()
            },
            onError: (error) => {
                toast("Error al guardar la transacción " + getApiErrorMessage(error))
            },
        });
    };

    const handleSave = () => {
        if (cantidad == 0) {
            toast("La cantidad no puede ser 0")
            return
        }
        if (itemId == 0) {
            toast("Debes seleccionar un item")
            return
        }
        if (accion == "") {
            toast("Debes seleccionar una acción")
            return
        }
        let calculatedBestBefore = bestBefore ? bestBefore.toFormat("yyyy-MM-dd") : null;
        const payload: any = {
            foodItemId: Number(itemId),
            quantity: cantidad,
            transactionType: accion,
            code: codigo,
            note: notas,
            bestBefore: calculatedBestBefore
        }
        if (isEditMode) {
            payload.id = initialData!.id;
        }
        save(payload);
    }

    const clearInputs = () => {
        setTimeout(() => {
            setCodigo("");
            setItemId(0);
            setCantidad(1);
            setAccion("restock");
            setNotas("");
            setBestBefore(undefined);
        }, 100)
    }
    

    const handleDialogChange = (open: boolean) => {
        onOpenChange?.(open);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            {!hideButton && <DialogTrigger asChild>
                <Button><CirclePlus /></Button>
            </DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Editar" : "Nueva"} transacción</DialogTitle>
                    <DialogDescription>
                        Ingresa, egresa o ajusta la cantidad de un alimento
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '1fr 3fr' }}>
                    <Label htmlFor="item">
                        Item
                    </Label>
                    <ComboboxAlimentos value={itemId} onChange={setItemId} hideTodos={true} />
                    <Label htmlFor="quantity">
                        Cantidad
                    </Label>
                    <Input id="quantity" value={cantidad} type="number"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCantidad(parseFloat(e.target.value))} />
                    <Label htmlFor="accion">
                        Accion
                    </Label>
                    <Select value={accion} onValueChange={(value) => setAccion(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona accion" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="consumption">Consumo</SelectItem>
                                <SelectItem value="restock">Reposición</SelectItem>
                                <SelectItem value="adjustment">Ajuste</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Label htmlFor="codigo">
                        Código
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input id="codigo" maxLength={3} autoComplete="off"
                            disabled={accion !== "restock"}
                            value={codigo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value.toUpperCase())} />
                        {!isEditMode && accion === "restock" && codigoSugerido && (
                            <Badge variant="outline"
                                className={codigo === codigoSugerido
                                    ? "opacity-50 text-muted-foreground cursor-default"
                                    : "bg-orange-500 dark:bg-orange-900 cursor-pointer"}
                                title={codigo === codigoSugerido ? "Codigo sugerido aplicado" : "Usar codigo sugerido"}
                                onClick={() => setCodigo(codigoSugerido)}>
                                {codigoSugerido}
                            </Badge>
                        )}
                    </div>
                    <Label htmlFor="notas">
                        Vencimiento
                    </Label>
                    <DatePickerInput value={bestBefore}
                        disabled={accion !== "restock"}
                        onChange={(e) => e && setBestBefore(e)} />
                    <Label htmlFor="notas">
                        Notas
                    </Label>
                    <Input id="notas" value={notas} autoComplete="off"
                        disabled={accion !== "restock"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotas(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default FoodTransactionRecord