import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { CirclePlus, Loader2 } from "lucide-react"
import { Input } from './ui/input';
import { DatePicker } from './DatePicker';
import { DateTime } from 'luxon';
import { useAppState } from "@/AppState"
import { toast } from "sonner"
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import api from "@/lib/api";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ComboboxCategorias } from './ComboboxCategorias';
import { Documento } from '@/models/Documento';

interface DocRecordProps {
    hideButton?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    /** Pass initial data to avoid fetching - for edit mode with data from parent */
    initialData?: Documento | null;
}

const DocRecord: React.FC<DocRecordProps> = ({ hideButton = false, onOpenChange, isOpen: controlledIsOpen, initialData }) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const [disableCategoria, setDisableCategoria] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

    const { tipoDocs } = useAppState()
    const queryClient = useQueryClient();
    const [monto, setMonto] = useState<number>(0);
    const [proposito, setProposito] = useState<string>('');
    const [fecha, setFecha] = useState<DateTime>(DateTime.now());
    const [tipoDoc, setTipoDoc] = useState<number>(1);
    const [categoria, setCategoria] = useState<number>(0);

    const isEditMode = !!initialData;

    // Fetch fresh data in background to ensure we have latest version
    const { data: freshData } = useQuery<Documento>({
        queryKey: ['doc', initialData?.id],
        queryFn: async () => {
            const { data } = await api.get(`/documentos?id[]=${initialData!.id}`);
            return data[0];
        },
        enabled: isOpen && !!initialData,
        staleTime: 0,
    });

    // Use fresh data if available, otherwise use initialData
    const docData = freshData ?? initialData;

    useEffect(() => {
        if (isOpen) {
            if (docData) {
                // Edit mode: use data (instant from initialData, updates if freshData differs)
                setMonto(docData.monto);
                setProposito(docData.proposito);
                setFecha(DateTime.fromFormat(docData.fecha, "yyyy-MM-dd"));
                setTipoDoc(docData.fk_tipoDoc);
                setCategoria(docData.fk_categoria ?? 0);
            } else {
                // New document mode: reset to defaults
                setMonto(0);
                setProposito('');
                setFecha(DateTime.now());
                setTipoDoc(1);
                setCategoria(0);
            }
        }
    }, [isOpen, docData]);

    useEffect(() => {
        if (tipoDoc == 1) {
            setDisableCategoria(false)
        } else {
            setDisableCategoria(true)
            setCategoria(0)
        }
    }, [tipoDoc])

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.delete("/documentos", { data: { id: initialData?.id } });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            handleDialogChange(false);
            toast('Documento Eliminado');
        },
        onError: () => {
            toast('Error al eliminar documento');
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            const method = isEditMode ? 'put' : 'post';
            const { data } = await api[method]("/documentos", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            handleDialogChange(false);
            toast(isEditMode ? 'Documento Actualizado' : 'Documento Agregado');
        },
        onError: () => {
            toast('Error al guardar documento');
        }
    });

    const handleSave = () => {
        if (tipoDoc == 0) {
            toast('Debe seleccionar un tipo de documento');
            return;
        }
        if (tipoDoc == 1 && !categoria) {
            toast('Debe seleccionar una categoria');
            return;
        }
        const payload: { id?: number; monto: number; proposito: string; fecha: string; fk_tipoDoc: number; fk_categoria: number | null } = {
            monto,
            proposito,
            fecha: fecha.toFormat('yyyy-MM-dd'),
            fk_tipoDoc: tipoDoc,
            fk_categoria: tipoDoc == 1 ? categoria : null
        };
        if (isEditMode) {
            payload.id = initialData!.id;
        }
        saveMutation.mutate(payload);
    };

    const handleDialogChange = (open: boolean) => {
        // If we have a parent controlling it, call the parent's callback
        onOpenChange?.(open);

        // Otherwise, fall back to local state
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(open);
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
                        <DialogTitle>{isEditMode ? 'Editar Documento' : 'Agregar Documento'}</DialogTitle>
                        <DialogDescription>
                            {/* To avoid anoying warning */}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '1fr 3fr' }}>
                        <Label>Monto</Label>
                        <NumberInput value={monto} onChange={setMonto} decimalPlaces={0} />
                        <Label>Proposito</Label>
                        <Input
                            value={proposito}
                            onChange={(e) => setProposito(e.target.value)}
                        />
                        <Label>Fecha</Label>
                        <DatePicker
                            value={fecha}
                            onChange={(e) => e && setFecha(e)}
                        />
                        <Label>Tipo Doc</Label>
                        <Select value={String(tipoDoc)} onValueChange={(e) => {
                            setTipoDoc(Number(e))
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {tipoDocs.map((tipo) => (
                                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                                            {tipo.descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Label>Categoria</Label>
                        <ComboboxCategorias
                            value={categoria}
                            onChange={setCategoria}
                            disabled={disableCategoria}
                        />
                    </div>
                    <DialogFooter>
                        {isEditMode && (
                            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending || saveMutation.isPending}>
                                {deleteMutation.isPending && <Loader2 className="animate-spin" />}
                                Eliminar
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={deleteMutation.isPending || saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="animate-spin" />}
                            {isEditMode ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DocRecord