import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import numeral from 'numeral';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';
import { useQuery } from '@tanstack/react-query';
import api from "@/lib/api";

const OKLCH_GREEN_600 = { l: 62.7, c: 0.194, h: 149.214 };
const OKLCH_RED_600 = { l: 57.7, c: 0.245, h: 27.325 };

const getPercentageColor = (percent: number) => {
    // Ensure percentage is between 0 and 100
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const t = clampedPercent / 100; // Normalised t-value from 0 to 1

    // Linear interpolation for each Oklch component
    const interpolatedL = OKLCH_GREEN_600.l + (OKLCH_RED_600.l - OKLCH_GREEN_600.l) * t;
    const interpolatedC = OKLCH_GREEN_600.c + (OKLCH_RED_600.c - OKLCH_GREEN_600.c) * t;
    const interpolatedH = OKLCH_GREEN_600.h + (OKLCH_RED_600.h - OKLCH_GREEN_600.h) * t;

    return `oklch(${interpolatedL}% ${interpolatedC} ${interpolatedH})`;
};


function UsagePercentage(_props: unknown, ref: React.Ref<unknown>) {
    const [topGastos, setTopGastos] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard', 'usage-percentage'],
        queryFn: async () => {
            const { data: result } = await api.get("/curr-month-spending");

            const gasto = result.data.find((o: any) => o.fk_tipoDoc == 1);
            const ingresos = result.data.find((o: any) => o.fk_tipoDoc == 3);

            if (!gasto || !ingresos) {
                return null;
            }

            return {
                percentage: result.porcentajeUsado,
                thisMonthIngresos: ingresos.sumMonto,
                thisMonthGastos: gasto.sumMonto,
                thisRemanente: ingresos.sumMonto - gasto.sumMonto,
                allTopGastos: result.topGastos,
            };
        },
    });

    const percentage = data?.percentage ?? 0;
    const thisMonthIngresos = data?.thisMonthIngresos ?? 0;
    const thisMonthGastos = data?.thisMonthGastos ?? 0;
    const thisRemanente = data?.thisRemanente ?? 0;
    const allTopGastos = data?.allTopGastos ?? [];

    const calculateVisibleItems = () => {
        if (!listRef.current) return;

        const listHeight = listRef.current.clientHeight;
        const itemHeight = 24;
        const maxItems = Math.max(1, Math.floor(listHeight / itemHeight));
        const itemsToShow = Math.min(maxItems, allTopGastos.length);

        setTopGastos(allTopGastos.slice(0, itemsToShow));
    };

    useEffect(() => {
        if (allTopGastos.length > 0 && listRef.current) {
            const timeoutId = setTimeout(() => {
                calculateVisibleItems();
            }, 100);

            const resizeObserver = new ResizeObserver(() => {
                calculateVisibleItems();
            });

            if (listRef.current) {
                resizeObserver.observe(listRef.current);
            }

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
            };
        }
    }, [allTopGastos]);

    // Keep ref for backwards compatibility
    useImperativeHandle(ref, () => ({
        refetchData: () => refetch(),
    }))

    if (isLoading) {
        return (
            <Card className='h-full'>
                <CardHeader>
                    <div className="grid grid-cols-2">
                        <div>
                            <span className='text-muted-foreground'>% Gasto</span>
                            <p className="text-2xl font-semibold tabular-nums">
                                {numeral(percentage).format("0,0.0")}%
                            </p>
                        </div>
                        <div>
                            <span className='text-muted-foreground'>
                                Remanente
                            </span>
                            <p className='text-2xl font-semibold tabular-nums'>{numeral(thisRemanente).format("$0,0")}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 justify-between">
                        <div>
                            <span className="text-muted-foreground">
                                Ingresos
                            </span>
                            <p>{numeral(thisMonthIngresos).format("$0,0")}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Gastos
                            </span>
                            <p>{numeral(thisMonthGastos).format("$0,0")}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-3">
                        <Skeleton className="h-12.5 w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-50" />
                            <Skeleton className="h-4 w-37.5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='h-full flex flex-col overflow-hidden'>
            <CardHeader>
                <div className="grid grid-cols-2">
                    <div>
                        <span className='text-muted-foreground'>% Gasto</span>
                        <div className="flex items-stretch gap-3">
                            <p className="text-2xl font-semibold tabular-nums">
                                {numeral(percentage).format("0,0.0")}%
                            </p>
                            <div className="w-1 bg-gray-200 rounded-full dark:bg-gray-700 flex flex-col justify-end">
                                <div
                                    className="w-1 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        height: `${Math.min(percentage, 100)}%`,
                                        backgroundColor: getPercentageColor(percentage)
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <span className='text-muted-foreground'>
                            Remanente
                        </span>
                        <p className='text-2xl font-semibold tabular-nums'>{numeral(thisRemanente).format("$0,0")}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 justify-between">
                    <div>
                        <span className="text-muted-foreground">
                            Gastos
                        </span>
                        <p>{numeral(thisMonthGastos).format("$0,0")}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">
                            Ingresos
                        </span>
                        <p>{numeral(thisMonthIngresos).format("$0,0")}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='flex flex-col gap-2 flex-1 overflow-hidden' ref={containerRef}>
                <span className="text-muted-foreground">
                    Top Gastos
                </span>
                <div className='flex flex-col gap-1 text-sm flex-1 overflow-hidden w-full' ref={listRef}>
                    {topGastos.map((gasto, index) => (
                        <div key={index} className="flex gap-2 overflow-hidden">
                            <span className="truncate">{gasto.proposito}</span>
                            <span className="shrink-0 tabular-nums ml-auto">{numeral(gasto.monto).format('$0,0')}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default forwardRef(UsagePercentage)