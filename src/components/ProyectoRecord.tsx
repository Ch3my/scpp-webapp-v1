import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { CirclePlus, Loader2 } from "lucide-react"
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from "sonner"
import { useSaveProyecto } from '@/api/hooks';
import { getApiErrorMessage } from '@/lib/api-errors';

import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

import { NumberInput } from './NumberInput';
import { CreateProyecto, Proyecto, UpdateProyecto } from '@/models/Proyecto';

interface ProyectoRecordProps {
    hideButton?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    /** Presence means edit mode. Parent passes a row from the live ['proyectos'] query. */
    initialData?: Proyecto | null;
}

const ProyectoRecord: React.FC<ProyectoRecordProps> = ({ hideButton = false, onOpenChange, isOpen: controlledIsOpen, initialData }) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

    const [nombre, setNombre] = useState<string>('');
    const [descripcion, setDescripcion] = useState<string>('');
    const [orden, setOrden] = useState<number>(0);
    const [activo, setActivo] = useState<boolean>(true);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (!isOpen) return;
        if (initialData) {
            setNombre(initialData.nombre);
            setDescripcion(initialData.descripcion ?? '');
            setOrden(initialData.orden ?? 0);
            setActivo(initialData.activo);
        } else {
            setNombre('');
            setDescripcion('');
            setOrden(0);
            setActivo(true);
        }
    }, [isOpen, initialData]);

    const handleDialogChange = (open: boolean) => {
        onOpenChange?.(open);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
        }
    };

    const proyectoMutation = useSaveProyecto();

    const saveMutation = {
        isPending: proyectoMutation.isPending,
        mutate: (payload: CreateProyecto | UpdateProyecto) =>
            proyectoMutation.mutate(payload, {
                onSuccess: () => {
                    handleDialogChange(false);
                    toast(isEditMode ? 'Proyecto Actualizado' : 'Proyecto Agregado');
                },
                onError: (error) => {
                    toast.error('Error al guardar el proyecto: ' + getApiErrorMessage(error));
                },
            }),
    };

    const handleSave = () => {
        if (nombre.trim() === '') {
            toast('El nombre no puede estar vacío');
            return;
        }
        if (orden < 0 || Number.isNaN(orden)) {
            toast('El orden no puede ser negativo');
            return;
        }

        const descripcionValue = descripcion.trim() === '' ? null : descripcion;

        if (isEditMode) {
            const payload: UpdateProyecto = {
                id: initialData!.id,
                nombre: nombre.trim(),
                descripcion: descripcionValue,
                activo, // always sent: PUT is a full replace
                ...(orden > 0 ? { orden } : {}),
            };
            saveMutation.mutate(payload);
        } else {
            const payload: CreateProyecto = {
                nombre: nombre.trim(),
                descripcion: descripcionValue,
                activo,
                ...(orden > 0 ? { orden } : {}),
            };
            saveMutation.mutate(payload);
        }
    };

    return (
        <>
            {!hideButton && (
                <Button variant="outline" onClick={() => handleDialogChange(true)}>
                    <CirclePlus />
                </Button>
            )}
            <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Editar Proyecto' : 'Agregar Proyecto'}</DialogTitle>
                        <DialogDescription>
                            {/* To avoid anoying warning */}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '1fr 3fr' }}>
                        <Label>Nombre</Label>
                        <Input
                            value={nombre}
                            autoComplete="off"
                            onChange={(e) => setNombre(e.target.value)}
                        />
                        <Label>Orden</Label>
                        <NumberInput value={orden} onChange={setOrden} decimalPlaces={0} />
                        <Label>Activo</Label>
                        <div>
                            <Switch checked={activo} onCheckedChange={setActivo} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Descripción</Label>
                        <Textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="min-h-32"
                        />
                        <p className="text-xs text-muted-foreground">
                            Se muestra como texto plano; los saltos de línea se conservan.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="animate-spin" />}
                            {isEditMode ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProyectoRecord
