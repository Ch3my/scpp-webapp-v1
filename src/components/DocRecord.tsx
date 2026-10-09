import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { CirclePlus, Loader2, Sparkles, Tags, Trash2 } from "lucide-react"
import { Input } from './ui/input';
import { DatePicker } from './DatePicker';
import { DateTime } from 'luxon';
import numeral from 'numeral';
import { toast } from "sonner"
import { useDocumento, useSaveDocumento, useDeleteDocumento, useSugerirCategoria, useTipoDocs } from '@/api/hooks';
import { cn } from '@/lib/utils';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from './ui/button';
import { Kbd } from './ui/kbd';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/responsive-dialog";

import { NumberInput } from './NumberInput';
import { ComboboxCategorias } from './ComboboxCategorias';
import { ComboboxProyectos } from './ComboboxProyectos';
import { CuotasPicker } from './CuotasPicker';
import { Documento } from '@/models/Documento';

/** Only this tipoDoc carries a categoria and a proyecto. */
const TIPO_DOC_GASTO = 1;

/** Past this many tipos the segmented control gets cramped, so fall back to a Select. */
const MAX_SEGMENTED_TIPOS = 4;

/** Days the save path puts between consecutive cuotas. */
const DIAS_POR_CUOTA = 30;

interface DocRecordProps {
    hideButton?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    /** Pass initial data to avoid fetching - for edit mode with data from parent */
    initialData?: Documento | null;
}

const DocRecord: React.FC<DocRecordProps> = ({ hideButton = false, onOpenChange, isOpen: controlledIsOpen, initialData }) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

    const { data: tipoDocs = [] } = useTipoDocs()
    const [monto, setMonto] = useState<number>(0);
    const [proposito, setProposito] = useState<string>('');
    const [fecha, setFecha] = useState<DateTime>(DateTime.now());
    const [tipoDoc, setTipoDoc] = useState<number>(TIPO_DOC_GASTO);
    const [categoria, setCategoria] = useState<number>(0);
    // Last categoria the classifier filled in, so the field can say so
    const [categoriaSugerida, setCategoriaSugerida] = useState<number>(0);
    const [proyecto, setProyecto] = useState<number>(0);
    const [cuotas, setCuotas] = useState<number>(0);

    const isEditMode = !!initialData;
    const isGasto = tipoDoc === TIPO_DOC_GASTO;
    const splitEnCuotas = !isEditMode && cuotas >= 2;

    // Fetch fresh data in background to ensure we have latest version
    const { data: freshData } = useDocumento(initialData?.id, isOpen && !!initialData);

    // Use fresh data if available, otherwise use initialData
    const docData = freshData ?? initialData;

    useEffect(() => {
        if (isOpen) {
            setCategoriaSugerida(0);
            if (docData) {
                // Edit mode: use data (instant from initialData, updates if freshData differs)
                setMonto(docData.monto);
                setProposito(docData.proposito);
                setFecha(DateTime.fromFormat(docData.fecha, "yyyy-MM-dd"));
                setTipoDoc(docData.fk_tipoDoc);
                setCategoria(docData.fk_categoria ?? 0);
                setProyecto(docData.fk_proyecto ?? 0);
                setCuotas(0);
            } else {
                // New document mode: reset to defaults
                setMonto(0);
                setProposito('');
                setFecha(DateTime.now());
                setTipoDoc(TIPO_DOC_GASTO);
                setCategoria(0);
                setProyecto(0);
                setCuotas(0);
            }
        }
    }, [isOpen, docData]);

    // Leaving the proposito field fills an empty categoria from the classifier.
    // A categoria that is already set - picked, saved, or suggested earlier - is
    // never touched, and an unconfident answer (null) leaves the field empty.
    const sugerirCategoria = useSugerirCategoria();
    const handlePropositoBlur = async () => {
        if (!isGasto || categoria !== 0) return;
        const sugerencia = await sugerirCategoria(proposito, monto).catch(() => null);
        const sugerida = sugerencia?.fk_categoria;
        if (!sugerida) return;
        setCategoriaSugerida(sugerida);
        // The user may have picked one while the request was in flight
        setCategoria((actual) => (actual === 0 ? sugerida : actual));
    };

    // Categoria and proyecto are deliberately NOT cleared when the tipo stops being
    // a gasto: the panel only unmounts, so toggling the tipo away and back brings the
    // original classification with it. handleSave already sends null for other tipos.

    // Both hooks invalidate documentos + dashboard + proyectos. Invalidating the
    // whole documentos tree covers the dashboard list and every proyecto pane, so a
    // gasto moving between proyectos needs no tracking of its previous value.
    const docDeleteMutation = useDeleteDocumento();
    const docSaveMutation = useSaveDocumento();

    const deleteMutation = {
        isPending: docDeleteMutation.isPending,
        mutate: () => {
            if (!initialData) return;
            docDeleteMutation.mutate(initialData.id, {
                onSuccess: () => {
                    handleDialogChange(false);
                    toast('Documento Eliminado');
                },
                onError: () => toast('Error al eliminar documento'),
            });
        },
    };

    const saveMutation = {
        isPending: docSaveMutation.isPending,
        mutate: (payload: unknown) =>
            docSaveMutation.mutate({ payload, isEdit: isEditMode }, {
                onSuccess: () => {
                    handleDialogChange(false);
                    toast(isEditMode ? 'Documento Actualizado' : 'Documento Agregado');
                },
                onError: () => toast('Error al guardar documento'),
            }),
    };

    const handleSave = () => {
        if (tipoDoc == 0) {
            toast('Debe seleccionar un tipo de documento');
            return;
        }
        if (!Number.isFinite(monto)) {
            toast('Debe ingresar un monto');
            return;
        }
        if (isGasto && !categoria) {
            toast('Debe seleccionar una categoria');
            return;
        }
        if (splitEnCuotas) {
            const montoPorCuota = Math.round(monto / cuotas);
            const payloads = Array.from({ length: cuotas }, (_, i) => ({
                monto: montoPorCuota,
                proposito: `${proposito} (${i + 1}/${cuotas})`,
                fecha: fecha.plus({ days: DIAS_POR_CUOTA * i }).toFormat('yyyy-MM-dd'),
                fk_tipoDoc: tipoDoc,
                fk_categoria: isGasto ? categoria : null,
                fk_proyecto: isGasto && proyecto > 0 ? proyecto : null,
            }));
            saveMutation.mutate(payloads);
            return;
        }
        const payload: { id?: number; monto: number; proposito: string; fecha: string; fk_tipoDoc: number; fk_categoria: number | null; fk_proyecto: number | null } = {
            monto,
            proposito,
            fecha: fecha.toFormat('yyyy-MM-dd'),
            fk_tipoDoc: tipoDoc,
            fk_categoria: isGasto ? categoria : null,
            fk_proyecto: isGasto && proyecto > 0 ? proyecto : null
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

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, handleSave]);

    const isPending = deleteMutation.isPending || saveMutation.isPending;

    // Mirrors what handleSave would post, so the split is visible before committing to it
    const cuotasPreview = splitEnCuotas && Number.isFinite(monto)
        ? {
            montoPorCuota: numeral(Math.round(monto / cuotas)).format('0,0'),
            desde: fecha.toFormat('LLL yyyy'),
            hasta: fecha.plus({ days: DIAS_POR_CUOTA * (cuotas - 1) }).toFormat('LLL yyyy'),
        }
        : null;

    return (
        <>
            {!hideButton && (
                <Button onClick={() => handleDialogChange(true)}>
                    <CirclePlus />
                </Button>
            )}
            <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="gap-3 p-5 sm:max-w-lg">
                    <DialogHeader className="gap-0">
                        <DialogTitle>{isEditMode ? 'Editar Documento' : 'Agregar Documento'}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {/* To avoid anoying warning */}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3">
                        {/* Tipo decides which fields exist below it, so it leads the form */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs tracking-wide text-muted-foreground uppercase">Tipo de documento</Label>
                            {tipoDocs.length > 0 && tipoDocs.length <= MAX_SEGMENTED_TIPOS ? (
                                <div
                                    className="grid gap-1 rounded-lg bg-muted p-1"
                                    style={{ gridTemplateColumns: `repeat(${tipoDocs.length}, minmax(0, 1fr))` }}
                                >
                                    {tipoDocs.map((tipo) => (
                                        <button
                                            key={tipo.id}
                                            type="button"
                                            onClick={() => setTipoDoc(Number(tipo.id))}
                                            aria-pressed={tipoDoc === Number(tipo.id)}
                                            className={cn(
                                                // min-h-11 only below sm, so desktop sizing is unchanged
                                                "min-h-11 truncate rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-0",
                                                tipoDoc === Number(tipo.id)
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {tipo.descripcion}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <Select value={String(tipoDoc)} onValueChange={(e) => setTipoDoc(Number(e))}>
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
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Monto</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
                                <NumberInput
                                    value={monto}
                                    onChange={setMonto}
                                    decimalPlaces={0}
                                    className="pl-7 tabular-nums"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Proposito</Label>
                            <Input
                                value={proposito}
                                autoComplete="off"
                                onChange={(e) => setProposito(e.target.value)}
                                onBlur={handlePropositoBlur}
                            />
                        </div>

                        <div className={cn("grid gap-3", !isEditMode && "sm:grid-cols-2")}>
                            <div className="grid gap-1.5">
                                <Label>Fecha</Label>
                                <DatePicker
                                    value={fecha}
                                    onChange={(e) => e && setFecha(e)}
                                />
                            </div>
                            {!isEditMode && (
                                <div className="grid gap-1.5">
                                    <Label>Cuotas</Label>
                                    <CuotasPicker value={cuotas} onChange={setCuotas} />
                                </div>
                            )}
                        </div>

                        {cuotasPreview && (
                            <p className="-mt-1 text-xs text-muted-foreground">
                                Se crearan <span className="font-medium text-foreground">{cuotas} documentos</span> de{' '}
                                <span className="font-medium text-foreground">${cuotasPreview.montoPorCuota}</span>{' '}
                                cada uno, entre {cuotasPreview.desde} y {cuotasPreview.hasta}.
                            </p>
                        )}

                        {/* Categoria and proyecto exist for gastos only */}
                        {isGasto && (
                            <div className="grid gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    <Tags className="size-3.5" />
                                    Clasificacion del gasto
                                </div>
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label className="flex items-center gap-1">
                                            Categoria <span className="text-destructive">*</span>
                                            {categoria !== 0 && categoria === categoriaSugerida && (
                                                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
                                                    <Sparkles className="size-3" />
                                                    Sugerida
                                                </span>
                                            )}
                                        </Label>
                                        <ComboboxCategorias
                                            value={categoria}
                                            onChange={setCategoria}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>
                                            Proyecto <span className="font-normal text-muted-foreground">(opcional)</span>
                                        </Label>
                                        <ComboboxProyectos
                                            value={proyecto}
                                            onChange={setProyecto}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <div className="flex flex-col gap-1.5 sm:items-end">
                            <div className="flex w-full items-center justify-end gap-2">
                                {isEditMode && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        aria-label="Eliminar"
                                        title="Eliminar"
                                        onClick={() => deleteMutation.mutate()}
                                        disabled={isPending}
                                    >
                                        {deleteMutation.isPending
                                            ? <Loader2 className="animate-spin" />
                                            : <Trash2 />}
                                    </Button>
                                )}
                                <Button className="flex-1 sm:flex-none" onClick={handleSave} disabled={isPending}>
                                    {saveMutation.isPending && <Loader2 className="animate-spin" />}
                                    {isEditMode ? 'Actualizar' : 'Guardar'}
                                </Button>
                            </div>
                            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                                <Kbd>Ctrl</Kbd>
                                <Kbd>S</Kbd>
                                para guardar
                            </span>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DocRecord
