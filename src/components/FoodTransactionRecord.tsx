import { useAppState } from "@/AppState"
import { Button } from "@/components/ui/button"

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
import { CirclePlus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { DateTime } from "luxon";
import { toast } from "sonner";
import { DatePickerInput } from "./DatePickerInput";
import { ComboboxAlimentos } from "./ComboboxAlimentos";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FoodTransaction } from "@/models/FoodTransaction";

interface Props {
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    hideButton?: boolean;
    /** Pass initial data to avoid fetching - for edit mode with data from parent */
    initialData?: FoodTransaction | null;
}

const FoodTransactionRecord: React.FC<Props> = ({ onOpenChange, isOpen: controlledIsOpen, hideButton, initialData }) => {
    const { apiPrefix, sessionId } = useAppState()
    const queryClient = useQueryClient();
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
    const { data: freshData } = useQuery<FoodTransaction>({
        queryKey: ['transaction', initialData?.id],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("sessionHash", sessionId);
            params.set("id", initialData!.id.toString());
            const response = await fetch(`${apiPrefix}/food/transaction?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const item = data[0];
            return {
                id: item.id,
                itemId: item.item_id,
                changeQty: item.change_qty,
                transactionType: item.transaction_type,
                occurredAt: DateTime.fromISO(item.occurred_at),
                note: item.note,
                code: item.code,
                bestBefore: item.best_before ? DateTime.fromISO(item.best_before) : null,
                food: undefined,
                remainingQuantity: item.remaining_quantity,
                fkTransaction: item.fk_transaction
            };
        },
        enabled: isOpen && !!initialData,
        staleTime: 0,
    });

    // Use fresh data if available, otherwise use initialData
    const transactionData = freshData ?? initialData;

    useEffect(() => {
        if (isOpen) {
            if (transactionData) {
                setItemId(transactionData.itemId);
                setCantidad(transactionData.changeQty);
                setAccion(transactionData.transactionType);
                setCodigo(transactionData.code);
                setNotas(transactionData.note);
                if (transactionData.bestBefore) {
                    setBestBefore(transactionData.bestBefore);
                }
            } else {
                clearInputs();
            }
        }
    }, [isOpen, transactionData]);

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const method = isEditMode ? 'PUT' : 'POST';
            let reponse = await fetch(`${apiPrefix}/food/transaction`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).then(response => response.json());

            if (reponse.hasErrors) {
                throw new Error(reponse.errorDescription[0]);
            }
            return reponse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            toast("Transacción guardada")
            handleDialogChange(false);
            clearInputs()
        },
        onError: (error: Error) => {
            toast("Error al guardar la transacción " + error.message)
        }
    })

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
            sessionHash: sessionId,
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
        mutation.mutate(payload);
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
                <Button variant="outline"><CirclePlus /></Button>
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
                    <Input id="codigo" maxLength={3} autoComplete="off"
                        disabled={accion !== "restock"}
                        value={codigo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value.toUpperCase())} />
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