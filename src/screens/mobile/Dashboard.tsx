import { lazy, Suspense, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import numeral from 'numeral';
import { CirclePlus, ListRestart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import DocRecord from '@/components/DocRecord';
import { DocsFilters } from '@/components/DocsFilters';
import { MiembroFilterSelect, PersonaBadge } from '@/components/MiembroFilterSelect';
import { DashboardMiembroProvider } from '@/components/dashboard-miembro';

import { Documento } from '@/models/Documento';
import { useDocumentos, useHasMultiplePeople, useTipoDocs, type DocumentFilters } from '@/api/hooks';
import { getPercentageColor } from '@/lib/percentage-color';
import { useShellScroll } from '@/shell/ShellScroll';
import { formatFecha } from '@/lib/format-fecha';

/**
 * Charts are lazy AND behind a tab, so a phone only pays for Recharts when the
 * Gráficos tab is actually opened - the gastos list is what people come for.
 */
const MonthlyGraphChart = lazy(() => import('@/components/MonthlyGraphChart'));
const UsagePercentage = lazy(() => import('@/components/UsagePercentaje'));
const CategoriasRadial = lazy(() => import('@/components/CategoriasRadial'));
const YearlySum = lazy(() => import('@/components/YearlySum'));
const GraficoCategorias = lazy(() => import('@/components/GraficoCategorias'));
const ExpensesByCategoryTimeseriesChart = lazy(
    () => import('@/components/ExpensesByCategoryTimeseriesChart')
);

const TIPO_DOC_GASTO = 1;
const TIPO_DOC_INGRESO = 3;

type Tab = 'documentos' | 'graficos';

const MobileDashboard = () => {
    const { data: tipoDocs = [] } = useTipoDocs();
    const showPersona = useHasMultiplePeople();

    const [tab, setTab] = useState<Tab>('documentos');
    const [fechaInicio, setFechaInicio] = useState<DateTime>(DateTime.now().startOf('month'));
    const [fechaTermino, setFechaTermino] = useState<DateTime>(DateTime.now().endOf('month'));
    const [selectedCategoria, setSelectedCategoria] = useState(0);
    const [selectedTipoDoc, setSelectedTipoDoc] = useState(1);
    // 'Para' filter, shared by both tabs; 0 = everyone
    const [selectedMiembro, setSelectedMiembro] = useState(0);
    const [searchPhrase, setSearchPhrase] = useState('');
    const [searchPhraseIgnoreOtherFilters, setSearchPhraseIgnoreOtherFilters] = useState(true);

    const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
    const [openDocDialog, setOpenDocDialog] = useState(false);

    const filters = useMemo<DocumentFilters>(
        () => ({
            fechaInicio: fechaInicio.toFormat('yyyy-MM-dd'),
            fechaTermino: fechaTermino.toFormat('yyyy-MM-dd'),
            searchPhrase,
            fk_tipoDoc: selectedTipoDoc,
            searchPhraseIgnoreOtherFilters,
            fk_categoria: selectedCategoria > 0 ? selectedCategoria : null,
            fk_miembro: selectedMiembro > 0 ? selectedMiembro : null,
        }),
        [
            fechaInicio,
            fechaTermino,
            searchPhrase,
            selectedTipoDoc,
            searchPhraseIgnoreOtherFilters,
            selectedCategoria,
            selectedMiembro,
        ]
    );

    const { data: docs = [], isLoading, isPlaceholderData } = useDocumentos(filters);

    /**
     * The spend percentage describes the PERIOD, so it follows only the dates -
     * not the categoria/search narrowing, which applies to the list alone.
     *
     * It is hidden outright when the list is narrowed, because the ratio would
     * then compare unlike things: a categoria filter leaves one slice of gastos,
     * and ingresos carry no categoria at all, so the denominator would be empty.
     *
     * Also hidden for the other tipos. It never read the tipoDoc - it is always
     * gastos over ingresos - but switching tipo resets the date range
     * (handleTipoDocChange below), so the figure moved and looked as though the
     * tipo drove it. It is a spending metric, so it belongs with Gastos only.
     *
     * Hidden for a 'para' filter too, for the categoria reason: ingresos are not
     * 'para' anyone, so one person's gastos have no denominator.
     */
    const showPorcentaje =
        selectedTipoDoc === TIPO_DOC_GASTO &&
        selectedCategoria === 0 &&
        selectedMiembro === 0 &&
        searchPhrase.trim() === '';

    const rangeFilters = useMemo<DocumentFilters>(
        () => ({
            fechaInicio: fechaInicio.toFormat('yyyy-MM-dd'),
            fechaTermino: fechaTermino.toFormat('yyyy-MM-dd'),
            searchPhrase: '',
            searchPhraseIgnoreOtherFilters: false,
        }),
        [fechaInicio, fechaTermino]
    );

    // `enabled` is false while hidden, so a narrowed list issues no request.
    const { data: gastosRango = [] } = useDocumentos(
        { ...rangeFilters, fk_tipoDoc: TIPO_DOC_GASTO },
        showPorcentaje
    );
    const { data: ingresosRango = [] } = useDocumentos(
        { ...rangeFilters, fk_tipoDoc: TIPO_DOC_INGRESO },
        showPorcentaje
    );

    const porcentajeUsado = useMemo(() => {
        if (!showPorcentaje) return null;
        const ingresos = ingresosRango.reduce((acc, doc) => acc + doc.monto, 0);
        if (ingresos <= 0) return null;
        const gastos = gastosRango.reduce((acc, doc) => acc + doc.monto, 0);
        return (gastos * 100) / ingresos;
    }, [showPorcentaje, gastosRango, ingresosRango]);

    const totalDocs = docs.reduce((acc: number, doc) => acc + doc.monto, 0);

    /**
     * One section per fecha. A Map keeps insertion order, so sections follow the
     * order the API returned rather than imposing a new one.
     */
    const groups = useMemo(() => {
        const byFecha = new Map<string, Documento[]>();
        for (const doc of docs) {
            const existing = byFecha.get(doc.fecha);
            if (existing) existing.push(doc);
            else byFecha.set(doc.fecha, [doc]);
        }
        return Array.from(byFecha, ([fecha, items]) => ({
            fecha,
            items,
            total: items.reduce((acc, doc) => acc + doc.monto, 0),
        }));
    }, [docs]);

    const handleTipoDocChange = (tipoDoc: string, resetAll: boolean) => {
        const parsed = parseInt(tipoDoc);
        setSelectedTipoDoc(parsed);

        if (parsed === 1) {
            setFechaInicio(DateTime.now().startOf('month'));
            setFechaTermino(DateTime.now().endOf('month'));
        } else if (parsed === 2 || parsed === 3) {
            setFechaInicio(DateTime.now().startOf('year'));
        }

        if (resetAll) {
            setSearchPhraseIgnoreOtherFilters(true);
            setSelectedCategoria(0);
            setSelectedMiembro(0);
            setSearchPhrase('');
        }
    };

    const { scrollToTop } = useShellScroll();

    /**
     * Single entry point for switching tabs. The panes are unrelated content, so
     * landing mid-scroll in the new one is disorienting - especially arriving
     * from a chart bar, which also changes the filters underneath.
     */
    const changeTab = (next: Tab) => {
        setTab(next);
        scrollToTop();
    };

    const openNewDoc = () => {
        setSelectedDoc(null);
        setOpenDocDialog(true);
    };

    return (
        // pb clears the FAB, so the last card is never trapped underneath it
        <DashboardMiembroProvider value={selectedMiembro}>
        <div className="flex flex-col gap-3 p-3 pb-20">
            <div role="tablist" className="bg-muted flex rounded-lg p-1">
                {(
                    [
                        ['documentos', 'Documentos'],
                        ['graficos', 'Gráficos'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => changeTab(value)}
                        className={cn(
                            'min-h-10 flex-1 rounded-md text-sm font-medium',
                            tab === value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'documentos' ? (
                <>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="min-h-11"
                            aria-label="Limpiar filtros"
                            onClick={() => handleTipoDocChange(String(selectedTipoDoc), true)}
                        >
                            <ListRestart />
                        </Button>
                        <DocsFilters
                            onFiltersChange={(next) => {
                                setFechaInicio(next.fechaInicio);
                                setFechaTermino(next.fechaTermino);
                                setSelectedCategoria(next.categoria);
                                setSearchPhrase(next.searchPhrase);
                                setSearchPhraseIgnoreOtherFilters(next.searchPhraseIgnoreOtherFilters);
                            }}
                            fechaInicio={fechaInicio}
                            fechaTermino={fechaTermino}
                            categoria={selectedCategoria}
                            searchPhrase={searchPhrase}
                            searchPhraseIgnoreOtherFilters={searchPhraseIgnoreOtherFilters}
                            // 44px like every other control in this row
                            triggerClassName="min-h-11"
                        />
                        {/* Also narrows the Graficos tab, which keeps the selection */}
                        <MiembroFilterSelect
                            value={selectedMiembro}
                            onChange={setSelectedMiembro}
                            className="h-auto min-h-11"
                        />
                        <Select
                            value={selectedTipoDoc.toString()}
                            onValueChange={(value) => handleTipoDocChange(value, false)}
                        >
                            <SelectTrigger className="min-h-11 flex-1">
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
                    </div>

                    <div className="border-primary/25 bg-primary/5 rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Total
                            </span>
                            <span className="text-muted-foreground text-xs">
                                {docs.length} {docs.length === 1 ? 'registro' : 'registros'}
                            </span>
                        </div>
                        <p className="mt-0.5 text-3xl font-bold tabular-nums">
                            ${numeral(totalDocs).format('0,0')}
                        </p>
                        <p className="text-foreground/70 mt-2 text-sm font-medium tabular-nums">
                            {formatFecha(fechaInicio.toFormat('yyyy-MM-dd'))}
                            <span className="text-muted-foreground font-normal"> al </span>
                            {formatFecha(fechaTermino.toFormat('yyyy-MM-dd'), true)}
                        </p>

                        {porcentajeUsado !== null && (
                            <div className="border-primary/20 mt-3 border-t pt-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-muted-foreground text-sm">
                                        Gastado del periodo
                                    </span>
                                    <span
                                        className="text-lg font-bold tabular-nums"
                                        style={{ color: getPercentageColor(porcentajeUsado) }}
                                    >
                                        {numeral(porcentajeUsado).format('0,0.0')}%
                                    </span>
                                </div>
                                <div
                                    className="bg-muted mt-1.5 h-2 w-full overflow-hidden rounded-full"
                                    role="progressbar"
                                    aria-valuenow={porcentajeUsado}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Gastado del mes"
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(Math.max(porcentajeUsado, 0), 100)}%`,
                                            backgroundColor: getPercentageColor(porcentajeUsado),
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dimmed only while the previous filters are still showing */}
                    <div
                        style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: 'opacity 0.2s' }}
                    >
                        {isLoading ? (
                            <div className="flex flex-col gap-2">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : groups.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Sin Datos
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {groups.map((group) => (
                                    <section key={group.fecha}>
                                        {/*
                                          * The date lives here, once per day, instead of on
                                          * every row. It used to sit beside the proposito at
                                          * nearly the same size and weight, which is what
                                          * made rows hard to tell apart. Uppercase, tracked
                                          * and muted marks it as a heading, not content.
                                          */}
                                        <div className="flex items-baseline justify-center gap-3 px-1 pb-1.5">
                                            <h2 className="text-muted-foreground text-base font-semibold tracking-wide uppercase">
                                                {formatFecha(group.fecha)}
                                            </h2>
                                            {group.items.length > 1 && (
                                                /* Same size and weight as a row's monto, so the
                                                   day total reads as the sum of the amounts below */
                                                <span className="text-muted-foreground text-lg font-bold tabular-nums">
                                                    {numeral(group.total).format('0,0')}
                                                </span>
                                            )}
                                        </div>

                                        {/* One card per day with divided rows - far fewer
                                            borders than a card per row. */}
                                        <div className="bg-card divide-border divide-y overflow-hidden rounded-xl border">
                                            {group.items.map((doc) => (
                                                <button
                                                    key={doc.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDoc(doc);
                                                        setOpenDocDialog(true);
                                                    }}
                                                    className="active:bg-accent flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="text-foreground block truncate text-base font-medium">
                                                            {doc.proposito}
                                                        </span>
                                                        {/*
                                                          * Filled neutral chip rather than an
                                                          * outline: the fill is what separates it
                                                          * from the proposito above, so the text
                                                          * can stay dim instead of competing.
                                                          * bg-muted sits just one step off the
                                                          * card, so it reads as a tag, not a
                                                          * highlight.
                                                          */}
                                                        <span className="mt-1 flex items-center gap-1.5">
                                                            {doc.categoria && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-muted text-muted-foreground min-w-0 border-transparent px-2 py-0 text-sm font-normal"
                                                                >
                                                                    <span className="truncate">
                                                                        {doc.categoria.descripcion}
                                                                    </span>
                                                                </Badge>
                                                            )}
                                                            {doc.proyecto && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-primary/10 text-primary/80 min-w-0 border-transparent px-2 py-0 text-sm font-normal"
                                                                >
                                                                    <span className="truncate">
                                                                        {doc.proyecto.nombre}
                                                                    </span>
                                                                </Badge>
                                                            )}
                                                            {/* Smaller text keeps it discreet; leading-5 gives it the
                                                                same 20px line, so it matches the text-sm badges' height */}
                                                            {/* miembro can be missing on data from a backend older than single ownership */}
                                                            {showPersona && doc.miembro && (
                                                                <PersonaBadge
                                                                    nombre={doc.miembro.nombre}
                                                                    className="text-xs leading-5"
                                                                />
                                                            )}
                                                        </span>
                                                    </span>
                                                    <span className="text-foreground shrink-0 text-lg font-bold tabular-nums">
                                                        {numeral(doc.monto).format('0,0')}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                    <div className="flex flex-col gap-3">
                        <UsagePercentage />
                        <YearlySum />
                        <CategoriasRadial />
                        <MonthlyGraphChart />
                        <GraficoCategorias
                            onBarClick={(catId, nMonths) => {
                                setFechaInicio(DateTime.now().minus({ months: nMonths }).startOf('month'));
                                setFechaTermino(DateTime.now().endOf('month'));
                                setSelectedCategoria(catId);
                                // Back to the list the bar just filtered, at the top
                                changeTab('documentos');
                            }}
                        />
                        <ExpensesByCategoryTimeseriesChart />
                    </div>
                </Suspense>
            )}

            {/* Fixed above the bottom nav so adding a gasto is always one tap away */}
            <Button
                onClick={openNewDoc}
                aria-label="Nuevo documento"
                className="fixed right-4 z-40 size-14 rounded-xl shadow-lg"
                style={{ bottom: 'calc(4.5rem + var(--safe-area-bottom))' }}
            >
                <CirclePlus className="size-6" />
            </Button>

            <DocRecord
                initialData={selectedDoc}
                isOpen={openDocDialog}
                hideButton={true}
                onOpenChange={(isOpen) => {
                    setOpenDocDialog(isOpen);
                    if (!isOpen) setSelectedDoc(null);
                }}
            />
        </div>
        </DashboardMiembroProvider>
    );
};

export default MobileDashboard;
