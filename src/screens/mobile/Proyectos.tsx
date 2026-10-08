import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft, CirclePlus, ListRestart, MoreHorizontal, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DataCardHeader,
    DataCardMeta,
    DataCardList,
} from '@/components/mobile/DataCardList';

import { ProyectoGastos } from '@/components/ProyectoGastos';
import ProyectoRecord from '@/components/ProyectoRecord';
import DeleteProyectoDialog from '@/components/DeleteProyectoDialog';
import DocRecord from '@/components/DocRecord';

import { Proyecto } from '@/models/Proyecto';
import { Documento } from '@/models/Documento';
import { useProyectos } from '@/api/hooks';

type StatusFilter = 'todos' | 'activos' | 'inactivos';

/**
 * List, then that proyecto's gastos. Selection is a search param so back
 * returns to the list rather than leaving Proyectos.
 */
const MobileProyectos = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedId = Number(searchParams.get('id')) || 0;

    const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
    const [openProyectoDialog, setOpenProyectoDialog] = useState(false);
    const [proyectoToDelete, setProyectoToDelete] = useState<Proyecto | null>(null);
    const [selectedGasto, setSelectedGasto] = useState<Documento | null>(null);
    const [openDocDialog, setOpenDocDialog] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
    const [nombreFilter, setNombreFilter] = useState('');

    const { data: proyectos = [], isLoading } = useProyectos();

    const visibleProyectos = useMemo(() => {
        const needle = nombreFilter.trim().toLowerCase();
        return proyectos
            .filter((p) => statusFilter === 'todos' || (statusFilter === 'activos' ? p.activo : !p.activo))
            .filter((p) => needle === '' || p.nombre.toLowerCase().includes(needle))
            .sort((a, b) => {
                const oa = a.orden ?? Number.MAX_SAFE_INTEGER;
                const ob = b.orden ?? Number.MAX_SAFE_INTEGER;
                return oa !== ob ? oa - ob : a.nombre.localeCompare(b.nombre);
            });
    }, [proyectos, statusFilter, nombreFilter]);

    // From the unfiltered list, so filtering a proyecto out of view cannot blank
    // a detail screen that is already open.
    const selectedProyecto = proyectos.find((p) => p.id === selectedId) ?? null;

    const isFiltered = statusFilter !== 'todos' || nombreFilter.trim() !== '';

    const closeDetail = () => setSearchParams({});

    if (selectedId !== 0) {
        return (
            <div className="flex min-h-full flex-col">
                <div className="p-2">
                    <Button variant="ghost" onClick={closeDetail} className="min-h-11">
                        <ArrowLeft className="mr-1 size-4" />
                        Proyectos
                    </Button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                    {selectedProyecto ? (
                        <ProyectoGastos
                            proyecto={selectedProyecto}
                            onGastoClick={(doc) => {
                                setSelectedGasto(doc);
                                setOpenDocDialog(true);
                            }}
                        />
                    ) : isLoading ? null : (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            Este proyecto ya no existe
                        </p>
                    )}
                </div>

                <DocRecord
                    initialData={selectedGasto}
                    isOpen={openDocDialog}
                    hideButton={true}
                    onOpenChange={(isOpen) => {
                        setOpenDocDialog(isOpen);
                        if (!isOpen) setSelectedGasto(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex gap-2">
                <Button
                    className="min-h-11"
                    aria-label="Nuevo proyecto"
                    onClick={() => {
                        setEditingProyecto(null);
                        setOpenProyectoDialog(true);
                    }}
                >
                    <CirclePlus />
                </Button>
                <Button
                    variant="outline"
                    className="min-h-11"
                    aria-label="Limpiar filtros"
                    onClick={() => {
                        setStatusFilter('todos');
                        setNombreFilter('');
                    }}
                >
                    <ListRestart />
                </Button>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="min-h-11 flex-1">
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
                className="min-h-11"
            />

            <DataCardList
                items={visibleProyectos}
                isLoading={isLoading}
                getKey={(proyecto) => proyecto.id}
                emptyMessage={isFiltered ? 'Ningun proyecto coincide' : 'Sin proyectos'}
                onItemClick={(proyecto) => setSearchParams({ id: String(proyecto.id) })}
                action={(proyecto) => (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-9 p-0"
                                aria-label={'Acciones para ' + proyecto.nombre}
                            >
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingProyecto(proyecto);
                                    setOpenProyectoDialog(true);
                                }}
                            >
                                <Pencil className="mr-2 size-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProyectoToDelete(proyecto)}>
                                <Trash className="mr-2 size-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                renderCard={(proyecto) => (
                    <>
                        <DataCardHeader
                            title={proyecto.nombre}
                            trailing={
                                proyecto.activo ? (
                                    <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/20">
                                        Activo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">
                                        Inactivo
                                    </Badge>
                                )
                            }
                        />
                        {proyecto.descripcion && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                {proyecto.descripcion}
                            </p>
                        )}
                        <DataCardMeta>
                            {proyecto.initialDate && <span>Desde {proyecto.initialDate}</span>}
                            {proyecto.finalDate && <span>Hasta {proyecto.finalDate}</span>}
                        </DataCardMeta>
                    </>
                )}
            />

            <ProyectoRecord
                key={editingProyecto?.id ?? 'new'}
                initialData={editingProyecto}
                isOpen={openProyectoDialog}
                hideButton={true}
                onOpenChange={(isOpen) => {
                    setOpenProyectoDialog(isOpen);
                    if (!isOpen) setEditingProyecto(null);
                }}
            />
            <DeleteProyectoDialog
                proyecto={proyectoToDelete}
                onClose={() => setProyectoToDelete(null)}
                onDeleted={closeDetail}
            />
        </div>
    );
};

export default MobileProyectos;
