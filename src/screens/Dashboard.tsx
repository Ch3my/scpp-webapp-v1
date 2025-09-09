import React, { useEffect, useRef, useState } from 'react';
import ScreenTitle from '@/components/ScreenTitle';
import { useAppState } from "@/AppState"

import { DateTime } from 'luxon';
import numeral from 'numeral';
import { Label } from '@/components/ui/label';
import DocRecord from '@/components/DocRecord';
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
import MonthlyGraphChart from '@/components/MonthlyGraphChart';
// import GraficoCategorias from '@/components/GraficoCategorias';
import UsagePercentage from '@/components/UsagePercentaje';
import CategoriasRadial from '@/components/CategoriasRadial';
import YearlySum from '@/components/YearlySum';
import GraficoCategorias from '@/components/GraficoCategorias';


const Dashboard: React.FC = () => {
    const { apiPrefix, sessionId, tipoDocs } = useAppState()
    const [fechaInicio, setFechaInicio] = useState<DateTime>(DateTime.now().startOf('month'));
    const [fechaTermino, setFechaTermino] = useState<DateTime>(DateTime.now().endOf('month'));
    const [selectedCategoria, setSelectedCategoria] = useState<number>(0);
    const [selectedTipoDoc, setSelectedTipoDoc] = useState<number>(1);
    const [selectedDocId, setSelectedDocId] = useState<number>(0);
    const [totalDocs, setTotalDocs] = useState<number>(0);
    const [searchPhrase, setSearchPhrase] = useState<string>('');
    const [searchPhraseIgnoreOtherFilters, setSearchPhraseIgnoreOtherFilters] = useState<boolean>(true)
    const [apiCalling, setApiCalling] = useState<boolean>(true)

    const [docs, setDocs] = useState<any[]>([]);
    const [openDocDialog, setOpenDocDialog] = useState<boolean>(false);
    const monthlyChartRef = useRef<{ refetchData?: () => void }>(null)
    const barChartRef = useRef<{ refetchData?: () => void }>(null)
    const radarChartRef = useRef<{ refetchData?: () => void }>(null)
    const percentageRef = useRef<{ refetchData?: () => void }>(null)
    const yearlySumRef = useRef<{ refetchData?: () => void }>(null)

    const getData = async (paramsOverride?: { fechaInicio?: DateTime, fechaTermino?: DateTime, categoria?: number, searchPhrase?: string, tipoDoc?: number, searchPhraseIgnoreOtherFilters?: boolean }) => {
        setApiCalling(true)
        let params = new URLSearchParams();
        params.set("sessionHash", sessionId);
        params.set("fechaInicio", (paramsOverride?.fechaInicio || fechaInicio)?.toFormat('yyyy-MM-dd'));
        params.set("fechaTermino", (paramsOverride?.fechaTermino || fechaTermino)?.toFormat('yyyy-MM-dd'));
        params.set("searchPhrase", paramsOverride?.searchPhrase !== undefined ? paramsOverride.searchPhrase : searchPhrase);
        params.set("fk_tipoDoc", (paramsOverride?.tipoDoc || selectedTipoDoc).toString());
        params.set("searchPhraseIgnoreOtherFilters", (paramsOverride?.searchPhraseIgnoreOtherFilters || searchPhraseIgnoreOtherFilters).toString());

        // Extract the category value, prioritizing paramsOverride if it exists
        const categoria = paramsOverride?.categoria ?? selectedCategoria;
        if (categoria > 0) {
            params.set("fk_categoria", categoria.toString());
        }

        let data = await fetch(`${apiPrefix}/documentos?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
        setDocs(data);
        setTotalDocs(data.reduce((acc: number, doc: any) => acc + doc.monto, 0))
        setApiCalling(false)
    }

    const handleFiltersChange = (filters: { fechaInicio: DateTime; fechaTermino: DateTime; categoria: number; searchPhrase: string; searchPhraseIgnoreOtherFilters: boolean }) => {
        setFechaInicio(filters.fechaInicio)
        setFechaTermino(filters.fechaTermino)
        setSelectedCategoria(filters.categoria)
        setSearchPhrase(filters.searchPhrase)
        setSearchPhraseIgnoreOtherFilters(filters.searchPhraseIgnoreOtherFilters)
        getData({
            fechaInicio: filters.fechaInicio,
            fechaTermino: filters.fechaTermino,
            categoria: filters.categoria,
            searchPhrase: filters.searchPhrase,
            searchPhraseIgnoreOtherFilters: filters.searchPhraseIgnoreOtherFilters
        })
    }

    const docDialogOpenChange = (e: boolean) => {
        setOpenDocDialog(e)
        if (e === false) {
            setSelectedDocId(0)
            monthlyChartRef.current?.refetchData?.()
            barChartRef.current?.refetchData?.()
            percentageRef.current?.refetchData?.()
            radarChartRef.current?.refetchData?.()
            yearlySumRef.current?.refetchData?.()
            getData()
        }
    }

    const handleRowClick = (id: number) => {
        setSelectedDocId(id)
        setOpenDocDialog(true)
    }

    const handleNewDocBtn = () => {
        setSelectedDocId(0)
        setOpenDocDialog(!openDocDialog)
    }

    const handleTipoDocChange = (tipoDoc: string, resetAll: boolean) => {
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
            getData({ tipoDoc: parsedTipoDoc, fechaInicio: newFechaInicio, fechaTermino: newFechaTermino, categoria: 0, searchPhrase: "", searchPhraseIgnoreOtherFilters: true });
            setSearchPhraseIgnoreOtherFilters(true)
            setSelectedCategoria(0)
            setSearchPhrase("")
        } else {
            getData({ tipoDoc: parsedTipoDoc, fechaInicio: newFechaInicio, fechaTermino: newFechaTermino });
        }
    };

    const onBarClick = async (catId: number) => {
        let newFechaInicio = fechaInicio;
        let newFechaTermino = fechaTermino;
        newFechaInicio = DateTime.now().minus({ months: 12 }).startOf('month');
        newFechaTermino = DateTime.now().endOf('month');
        setFechaInicio(newFechaInicio);
        setFechaTermino(newFechaTermino);
        setSelectedCategoria(catId)
        getData({ categoria: catId, fechaInicio: newFechaInicio, fechaTermino: newFechaTermino });
    }

    useEffect(() => {
        getData()
    }, []);

    return (
        <div className="grid gap-4 p-2 w-screen h-screen grid-docs-layout" >
            <div className="flex flex-col overflow-auto">
                <ScreenTitle title="Dashboard" />
                <div className='flex gap-2 px-1 mb-2'>
                    <Button variant="outline" onClick={handleNewDocBtn}>
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
                    <DocRecord id={selectedDocId} isOpen={openDocDialog} hideButton={true} onOpenChange={docDialogOpenChange} />
                </div>
                <Label>Total: ${numeral(totalDocs).format("0,0")}</Label>

                <div className='overflow-auto' >
                    <Table size='compact'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Fecha</TableHead>
                                <TableHead>Proposito</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length === 0 && !apiCalling && (
                                <TableRow className='text-center text-muted-foreground'>
                                    <TableCell colSpan={3}>Sin Datos</TableCell>
                                </TableRow>)}
                            {docs.map((doc, index) => (
                                <TableRow key={index} onClick={() => handleRowClick(doc.id)}>
                                    <TableCell>{doc.fecha}</TableCell>
                                    <TableCell>{doc.proposito}</TableCell>
                                    <TableCell className="text-right">{numeral(doc.monto).format("0,0")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="grid gap-2">
                <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "5fr 3fr 6fr" }} >
                    <UsagePercentage ref={percentageRef} />
                    <YearlySum ref={yearlySumRef} />
                    <CategoriasRadial ref={radarChartRef} />
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: '5fr 3fr' }}>
                    <MonthlyGraphChart ref={monthlyChartRef} />
                    <GraficoCategorias onBarClick={(e) => onBarClick(e)} ref={barChartRef} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;