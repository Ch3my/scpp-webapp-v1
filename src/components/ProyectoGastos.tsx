import { DateTime } from 'luxon';
import numeral from 'numeral';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { Proyecto } from '@/models/Proyecto';
import { Documento } from '@/models/Documento';
import { useProyectoGastos } from '@/api/hooks';

interface ProyectoGastosProps {
    /** Always non-null: the screen renders a placeholder when nothing is selected */
    proyecto: Proyecto;
    onGastoClick: (doc: Documento) => void;
}

const formatFecha = (d: string | null) =>
    d ? DateTime.fromFormat(d, 'yyyy-MM-dd').toFormat('dd-MM-yyyy') : '—';

export function ProyectoGastos({ proyecto, onGastoClick }: ProyectoGastosProps) {
    const { initialDate, finalDate } = proyecto;

    // No isFetching dim here: selecting a proyecto with nothing cached renders
    // the skeleton below via isLoading, so isFetching would only ever fire for
    // background revalidation - where cached rows should stay bright.
    const { data: gastos = [], isLoading } = useProyectoGastos(
        proyecto.id,
        initialDate,
        finalDate
    );

    const total = gastos.reduce((acc: number, gasto: Documento) => acc + gasto.monto, 0);

    return (
        // flex-1/min-h-0 so the gastos table scrolls while the proyecto header stays put
        <div className='flex flex-col gap-2 flex-1 min-h-0'>
            <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{proyecto.nombre}</h2>
                    {proyecto.activo
                        ? <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/20">Activo</Badge>
                        : <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20">Inactivo</Badge>}
                </div>
                {proyecto.descripcion && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proyecto.descripcion}</p>
                )}
                <div className="flex flex-wrap gap-6 text-sm">
                    <span className="text-muted-foreground">
                        Primer gasto: <span className="text-foreground">{formatFecha(initialDate)}</span>
                    </span>
                    <span className="text-muted-foreground">
                        Último gasto: <span className="text-foreground">{formatFecha(finalDate)}</span>
                    </span>
                    <span className="text-muted-foreground">
                        Gastos: <span className="text-foreground">{gastos.length}</span>
                    </span>
                </div>
                <Label>Total: ${numeral(total).format("0,0")}</Label>
            </div>

            <div className='flex-1 min-h-0 overflow-auto'>
                <Table size='compact'>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-25">Fecha</TableHead>
                            <TableHead>Proposito</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell colSpan={3}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : gastos.length === 0 ? (
                            <TableRow className='text-center text-muted-foreground'>
                                <TableCell colSpan={3}>Sin gastos asignados</TableCell>
                            </TableRow>
                        ) : (
                            gastos.map((gasto) => (
                                <TableRow
                                    key={gasto.id}
                                    onClick={() => onGastoClick(gasto)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{gasto.fecha}</TableCell>
                                    <TableCell>{gasto.proposito}</TableCell>
                                    <TableCell className="text-right">{numeral(gasto.monto).format("0,0")}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
