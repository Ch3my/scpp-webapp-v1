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
    const [loading, setLoading] = useState<boolean>(false);
    const [nombre, setNombre] = useState<string>("");
    const [unit, setUnit] = useState<string>("");
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    // Decide whether to use the parent's isOpen or our local state
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
        // If we have a parent controlling it, call the parent's callback
        onOpenChange?.(open);

        // Otherwise, fall back to local state
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
        }

        // If closing the dialog, reset fields
        if (!open) {
            setTimeout(() => {
                if (!isEditing) {
                    setNombre("");
                    setUnit("");
                }
            }, 100);
        }
    };

    const handleSave = async () => {
        if (nombre == "") {
            toast("El nombre no puede estar vacío");
            return;
        }
        if (unit == "") {
            toast("La unidad no puede estar vacía");
            return;
        }
        setLoading(true);

        const payload: FoodItemPayload = {
            sessionHash: sessionId,
            name: nombre,
            unit: unit,
        };

        // If editing, add the ID to the payload
        if (isEditing && id) {
            payload.id = id;
        }

        try {
            await fetch(`${apiPrefix}/food/item`, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            toast(isEditing ? "Producto actualizado" : "Producto guardado");
            handleDialogChange(false);
        } catch (error) {
            console.error("Error saving food item:", error);
            toast.error(isEditing ? "Error al actualizar el producto" : "Error al guardar el producto");
        } finally {
            setTimeout(() => {
                // Do not change until dialog closes
                setLoading(false);
                if (!isEditing) {
                    setNombre("");
                    setUnit("");
                }
            }, 100);
        }
    };

    useEffect(() => {

    }, [isOpen])

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
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Actualizar" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FoodItemRecord;