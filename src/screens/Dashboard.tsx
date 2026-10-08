import { useState, useMemo, useTransition, lazy, Suspense } from 'react';
import ScreenTitle from '@/components/ScreenTitle';
import { useAppState } from "@/AppState"
import { useDocumentos, type DocumentFilters } from '@/api/hooks';

import { DateTime } from 'luxon';
import numeral from 'numeral';
import { Label } from '@/components/ui/label';
import DocRecord from '@/components/DocRecord';
import { Documento } from '@/models/Documento';
import { CirclePlus, ListRestart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocsFilters } from '@/components/DocsFilters';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Lazy load chart components to reduce initial bundle
const MonthlyGraphChart = lazy(() => import('@/components/MonthlyGraphChart'));
const UsagePercentage = lazy(() => import('@/components/UsagePercentaje'));
const CategoriasRadial = lazy(() => import('@/components/CategoriasRadial'));
const YearlySum = lazy(() => import('@/components/YearlySum'));
const GraficoCategorias = lazy(() => import('@/components/GraficoCategorias'));
const ExpensesByCategoryTimeseriesChart = lazy(() => import('@/components/ExpensesByCategoryTimeseriesChart'));


const Dashboard: React.FC = () => {
    const { tipoDocs } = useAppState()
    const [fechaInicio, setFechaInicio] = useState<DateTime>(DateTime.now().startOf('month'));
    const [fechaTermino, setFechaTermino] = useState<DateTime>(DateTime.now().endOf('month'));
    const [selectedCategoria, setSelectedCategoria] = useState<number>(0);
    const [selectedTipoDoc, setSelectedTipoDoc] = useState<number>(1);
    const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
    const [searchPhrase, setSearchPhrase] = useState<string>('');
    const [searchPhraseIgnoreOtherFilters, setSearchPhraseIgnoreOtherFilters] = useState<boolean>(true)
    const [openDocDialog, setOpenDocDialog] = useState<boolean>(false);
    // useTransition for filter changes - keeps UI responsive while fetching new data
    const [isFilterPending, startFilterTransition] = useTransition();

    // Serialised here so the query key is plain data rather than DateTime objects
    const filters = useMemo<DocumentFilters>(() => ({
        fechaInicio: fechaInicio.toFormat('yyyy-MM-dd'),
        fechaTermino: fechaTermino.toFormat('yyyy-MM-dd'),
        searchPhrase,
        fk_tipoDoc: selectedTipoDoc,
        searchPhraseIgnoreOtherFilters,
        fk_categoria: selectedCategoria > 0 ? selectedCategoria : null,
    }), [fechaInicio, fechaTermino, searchPhrase, selectedTipoDoc, searchPhraseIgnoreOtherFilters, selectedCategoria]);

    const { data: docs = [], isLoading, isPlaceholderData } = useDocumentos(filters);

    // True only while showing the PREVIOUS filters' rows, i.e. a filter change
    // in flight. Deliberately not isFetching: that is also true for background
    // revalidation (window refocus), where the cached rows are current enough
    // to stay bright and clickable.
    const isShowingStale = isPlaceholderData || isFilterPending;

    const totalDocs = docs.reduce((acc: number, doc) => acc + doc.monto, 0)

    const handleFiltersChange = (filters: { fechaInicio: DateTime; fechaTermino: DateTime; categoria: number; searchPhrase: string; searchPhraseIgnoreOtherFilters: boolean }) => {
        setFechaInicio(filters.fechaInicio)
        setFechaTermino(filters.fechaTermino)
        setSelectedCategoria(filters.categoria)
        setSearchPhrase(filters.searchPhrase)
        setSearchPhraseIgnoreOtherFilters(filters.searchPhraseIgnoreOtherFilters)
    }

    const docDialogOpenChange = (e: boolean) => {
        setOpenDocDialog(e)
        if (e === false) {
            setSelectedDoc(null)
            // Note: No need to manually refetch - DocRecord mutations invalidate 'docs' and 'dashboard' queries
        }
    }

    const handleRowClick = (doc: Documento) => {
        setSelectedDoc(doc)
        setOpenDocDialog(true)
    }

    const handleNewDocBtn = () => {
        setSelectedDoc(null)
        setOpenDocDialog(!openDocDialog)
    }

    const handleTipoDocChange = (tipoDoc: string, resetAll: boolean) => {
        startFilterTransition(() => {
            const parsedTipoDoc = parseInt(tipoDoc);
            setSelectedTipoDoc(parsedTipoDoc);

            let newFechaInicio = fechaInicio;
            let newFechaTermino = fechaTermino;

            if (parsedTipoDoc === 1) {
                newFechaInicio = DateTime.now().startOf('month');
                newFechaTermino = DateTime.now().endOf('month');
            } else if (parsedTipoDoc === 2 || parsedTipoDoc === 3) {
                newFechaInicio = DateTime.now().startOf('year');
            }

            setFechaInicio(newFechaInicio);
            setFechaTermino(newFechaTermino);

            if (resetAll) {
                setSearchPhraseIgnoreOtherFilters(true)
                setSelectedCategoria(0)
                setSearchPhrase("")
            }
        });
    };

    const onBarClick = (catId: number, nMonths: number) => {
        startFilterTransition(() => {
            const newFechaInicio = DateTime.now().minus({ months: nMonths }).startOf('month');
            const newFechaTermino = DateTime.now().endOf('month');
            setFechaInicio(newFechaInicio);
            setFechaTermino(newFechaTermino);
            setSelectedCategoria(catId);
        });
    }

    return (
        <div className="grid gap-4 p-2 w-screen h-screen grid-docs-layout" >
            <div className="flex flex-col overflow-auto h-full">
                <ScreenTitle title="Dashboard" />
                <div className='flex gap-2 px-1 mb-2'>
                    <Button onClick={handleNewDocBtn}>
                        <CirclePlus />
                    </Button>
                    <Button variant="outline" onClick={() => handleTipoDocChange(selectedTipoDoc.toString(), true)}>
                        <ListRestart />
                    </Button>
                    <DocsFilters onFiltersChange={handleFiltersChange} fechaInicio={fechaInicio} fechaTermino={fechaTermino}
                        categoria={selectedCategoria} searchPhrase={searchPhrase} searchPhraseIgnoreOtherFilters={searchPhraseIgnoreOtherFilters} />
                    <Select value={selectedTipoDoc.toString()} onValueChange={(e) => handleTipoDocChange(e, false)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Tipo Doc</SelectLabel>
                                {tipoDocs.map((tipo) => (
                                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                        {tipo.descripcion}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <DocRecord initialData={selectedDoc} isOpen={openDocDialog} hideButton={true} onOpenChange={docDialogOpenChange} />
                </div>
                <Label>Total: ${numeral(totalDocs).format("0,0")}</Label>

                <div className='overflow-auto'>
                    <Table size='compact'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-25">Fecha</TableHead>
                                <TableHead>Proposito</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody style={{ opacity: isShowingStale ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                            {docs.length === 0 && !isLoading && (
                                <TableRow className='text-center text-muted-foreground'>
                                    <TableCell colSpan={3}>Sin Datos</TableCell>
                                </TableRow>)}
                            {docs.map((doc, index) => (
                                <TableRow key={index} onClick={() => !isShowingStale && handleRowClick(doc)} style={{ cursor: isShowingStale ? 'not-allowed' : 'pointer' }}>
                                    <TableCell>{doc.fecha}</TableCell>
                                    <TableCell>{doc.proposito}</TableCell>
                                    <TableCell className="text-right">{numeral(doc.monto).format("0,0")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="grid gap-2 overflow-auto h-full">
                <Suspense fallback={null}>
                    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "minmax(16rem, 5fr) 3fr 6fr" }} >
                        <UsagePercentage />
                        <YearlySum />
                        <CategoriasRadial />
                    </div>
                </Suspense>
                <Suspense fallback={null}>
                    <div className="grid gap-2" style={{ gridTemplateColumns: '5fr 3fr' }}>
                        <MonthlyGraphChart />
                        <GraficoCategorias onBarClick={(catId, nMonths) => onBarClick(catId, nMonths)} />
                    </div>
                </Suspense>
                <Suspense fallback={null}>
                    <div className="grid gap-2">
                        <ExpensesByCategoryTimeseriesChart />
                    </div>
                </Suspense>
            </div>
        </div>
    );
};

export default Dashboard;