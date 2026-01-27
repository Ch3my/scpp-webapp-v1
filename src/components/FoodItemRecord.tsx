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
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface Props {
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    id?: number; // Optional ID for editing existing food items
    hideButton?: boolean; // Whether to hide the default trigger button
}

interface FoodItemPayload {
    sessionHash: string;
    name: string;
    unit: string;
    id?: number; // Make id optional in the payload type
}

const FoodItemRecord: React.FC<Props> = ({ onOpenChange, isOpen: controlledIsOpen, id, hideButton = false }) => {
    const { apiPrefix, sessionId } = useAppState()
    const queryClient = useQueryClient();
    const [nombre, setNombre] = useState<string>("");
    const [unit, setUnit] = useState<string>("");
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
    const isEditing = !!id;

    // Fetch food item data if ID is provided
    useEffect(() => {
        const fetchFoodItem = async () => {
            if (id) {
                if (id > 0 && isOpen) {
                    try {
                        const response = await fetch(`${apiPrefix}/food/items?id[]=${id}&sessionHash=${sessionId}`);
                        const data = await response.json();

                        if (data && data.length > 0) {
                            const item = data[0];
                            setNombre(item.name || "");
                            setUnit(item.unit || "");
                        } else {
                            toast.error("No se encontró el producto");
                        }
                    } catch (error) {
                        console.error("Error fetching food item:", error);
                        toast.error("Error al cargar el producto");
                    }
                }
            }
        };

        fetchFoodItem();
    }, [id, isOpen, apiPrefix]);

    const handleDialogChange = (open: boolean) => {
        onOpenChange?.(open);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
        }
    };

    const mutation = useMutation({
        mutationFn: async (payload: FoodItemPayload) => {
            const response = await fetch(`${apiPrefix}/food/item`, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to save');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['foods'] });
            toast(isEditing ? "Producto actualizado" : "Producto guardado");
            handleDialogChange(false);
            setNombre("");
            setUnit("");
        },
        onError: () => {
            toast.error(isEditing ? "Error al actualizar el producto" : "Error al guardar el producto");
        }
    });

    const handleSave = () => {
        if (nombre == "") {
            toast("El nombre no puede estar vacío");
            return;
        }
        if (unit == "") {
            toast("La unidad no puede estar vacía");
            return;
        }

        const payload: FoodItemPayload = {
            sessionHash: sessionId,
            name: nombre,
            unit: unit,
        };

        if (isEditing && id) {
            payload.id = id;
        }

        mutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            {!hideButton && (
                <DialogTrigger asChild>
                    <Button variant="outline"><CirclePlus /></Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar" : "Agregar"} Producto</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Actualizar la información del producto existente."
                            : "Agregar un nuevo tipo de producto a la base de datos."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            value={nombre}
                            className="col-span-3"
                            autoComplete="off"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">
                            Und medida (Kg, L, etc.)
                        </Label>
                        <Input
                            id="unit"
                            value={unit}
                            className="col-span-3"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnit(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Actualizar" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FoodItemRecord;