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
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useFoodItem, useSaveFoodItem } from "@/api/hooks"

interface Props {
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    id?: number; // Optional ID for editing existing food items
    hideButton?: boolean; // Whether to hide the default trigger button
}

interface FoodItemPayload {
    name: string;
    unit: string;
    id?: number; // Make id optional in the payload type
}

const FoodItemRecord: React.FC<Props> = ({ onOpenChange, isOpen: controlledIsOpen, id, hideButton = false }) => {
    const [nombre, setNombre] = useState<string>("");
    const [unit, setUnit] = useState<string>("");
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
    const isEditing = !!id;

    // Fetch food item data if ID is provided
    const { data: foodItem, isError } = useFoodItem(isOpen && id ? id : 0);

    useEffect(() => {
        if (!foodItem) return;
        setNombre(foodItem.name || "");
        setUnit(foodItem.unit || "");
    }, [foodItem]);

    useEffect(() => {
        if (isError) toast.error("Error al cargar el producto");
    }, [isError]);

    const handleDialogChange = (open: boolean) => {
        onOpenChange?.(open);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
        }
    };

    const saveMutation = useSaveFoodItem();

    const mutation = {
        isPending: saveMutation.isPending,
        mutate: (payload: FoodItemPayload) =>
            saveMutation.mutate({ payload, isEdit: isEditing }, {
                onSuccess: () => {
                    toast(isEditing ? "Producto actualizado" : "Producto guardado");
                    handleDialogChange(false);
                    setNombre("");
                    setUnit("");
                },
                onError: () => {
                    toast.error(isEditing ? "Error al actualizar el producto" : "Error al guardar el producto");
                },
            }),
    };

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
                    <Button><CirclePlus /></Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-106.25">
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