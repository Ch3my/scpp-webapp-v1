import { useState, useMemo, useEffect, useTransition, useDeferredValue } from 'react';
import { CirclePlus, ListRestart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import ScreenTitle from '@/components/ScreenTitle';
import { ProyectosList } from '@/components/ProyectosList';
import { ProyectoGastos } from '@/components/ProyectoGastos';
import ProyectoRecord from '@/components/ProyectoRecord';
import DeleteProyectoDialog from '@/components/DeleteProyectoDialog';
import DocRecord from '@/components/DocRecord';

import { Proyecto } from '@/models/Proyecto';
import { Documento } from '@/models/Documento';
import api from '@/lib/api';

type StatusFilter = 'todos' | 'activos' | 'inactivos';

const Proyectos = () => {
    const [selectedProyectoId, setSelectedProyectoId] = useState<number>(0);
    const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
    const [openProyectoDialog, setOpenProyectoDialog] = useState<boolean>(false);
    const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null);
    const [selectedGasto, setSelectedGasto] = useState<Documento | null>(null);
    const [openDocDialog, setOpenDocDialog] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
    const [nombreFilter, setNombreFilter] = useState<string>('');

    // Keeps the list responsive while the right pane's query kicks off
    const [, startSelectTransition] = useTransition();
    // Keeps typing fluid
    const deferredNombreFilter = useDeferredValue(nombreFilter);

    const { data: proyectos = [], isLoading } = useQuery<Proyecto[]>({
        queryKey: ['proyectos'],
        queryFn: async () => {
            const { data } = await api.get("/proyectos");
            return data;
        }
    });

    const visibleProyectos = useMemo(() => {
        const needle = deferredNombreFilter.trim().toLowerCase();
        return proyectos
            .filter(p => statusFilter === 'todos' || (statusFilter === 'activos' ? p.activo : !p.activo))
            .filter(p => needle === '' || p.nombre.toLowerCase().includes(needle))
            .sort((a, b) => {
                const oa = a.orden ?? Number.MAX_SAFE_INTEGER;
                const ob = b.orden ?? Number.MAX_SAFE_INTEGER;
                return oa !== ob ? oa - ob : a.nombre.localeCompare(b.nombre);
            });
    }, [proyectos, statusFilter, deferredNombreFilter]);

    const isFiltered = statusFilter !== 'todos' || deferredNombreFilter.trim() !== '';

    // Derived from the UNFILTERED list, so initialDate/finalDate are never a stale
    // snapshot and filtering a proyecto out of view does not blank the detail pane.
    const selectedProyecto = proyectos.find(p => p.id === selectedProyectoId) ?? null;

    // Backstop: clear a selection whose proyecto no longer exists
    useEffect(() => {
        if (!isLoading && selectedProyectoId !== 0 && !proyectos.some(p => p.id === selectedProyectoId)) {
            setSelectedProyectoId(0);
        }
    }, [isLoading, proyectos, selectedProyectoId]);

    const handleSelect = (id: number) => {
        startSelectTransition(() => setSelectedProyectoId(id));
    };

    const handleResetFilters = () => {
        setStatusFilter('todos');
        setNombreFilter('');
        startSelectTransition(() => setSelectedProyectoId(0));
    };

    const handleNewProyecto = () => {
        setEditingProyecto(null);
        setOpenProyectoDialog(true);
    };

    const handleEdit = (proyecto: Proyecto) => {
        setEditingProyecto(proyecto);
        setOpenProyectoDialog(true);
    };

    const proyectoDialogOpenChange = (isOpen: boolean) => {
        setOpenProyectoDialog(isOpen);
        if (!isOpen) {
            setEditingProyecto(null);
        }
    };

    const handleDeleted = (id: number) => {
        if (id === selectedProyectoId) {
            setSelectedProyectoId(0);
        }
    };

    const handleGastoClick = (doc: Documento) => {
        setSelectedGasto(doc);
        setOpenDocDialog(true);
    };

    const docDialogOpenChange = (isOpen: boolean) => {
        setOpenDocDialog(isOpen);
        if (!isOpen) {
            setSelectedGasto(null);
        }
    };

    return (
        <div className="grid gap-4 p-2 w-screen h-screen overflow-hidden" style={{ gridTemplateColumns: "1fr auto 2fr" }}>
            <div className='flex flex-col gap-2 overflow-y-auto'>
                <ScreenTitle title='Proyectos' />
                <div className='flex gap-2'>
                    <Button variant="outline" onClick={handleNewProyecto}><CirclePlus /></Button>
                    <Button variant="outline" onClick={handleResetFilters}><ListRestart /></Button>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="activos">Activos</SelectItem>
                                <SelectItem value="inactivos">Inactivos</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <Input
                    placeholder="Buscar proyecto..."
                    value={nombreFilter}
                    onChange={(event) => setNombreFilter(event.target.value)}
                />
                <ProyectosList
                    proyectos={visibleProyectos}
                    isLoading={isLoading}
                    selectedProyectoId={selectedProyectoId}
                    isFiltered={isFiltered}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={setProyectoToDelete}
                />
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div className='flex flex-col gap-2 overflow-auto'>
                <ScreenTitle title='Gastos del Proyecto' />
                {selectedProyecto ? (
                    <ProyectoGastos proyecto={selectedProyecto} onGastoClick={handleGastoClick} />
                ) : (
                    <div className="flex flex-1 items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg m-2">
                        <p className="text-muted-foreground text-sm">Selecciona un proyecto para ver sus gastos</p>
                    </div>
                )}
            </div>
            <ProyectoRecord
                key={editingProyecto?.id ?? 'new'}
                initialData={editingProyecto}
                isOpen={openProyectoDialog}
                hideButton={true}
                onOpenChange={proyectoDialogOpenChange}
            />
            <DeleteProyectoDialog
                proyecto={proyectoToDelete}
                onClose={() => setProyectoToDelete(null)}
                onDeleted={handleDeleted}
            />
            <DocRecord
                initialData={selectedGasto}
                isOpen={openDocDialog}
                hideButton={true}
                onOpenChange={docDialogOpenChange}
            />
        </div>
    );
};

export default Proyectos;
