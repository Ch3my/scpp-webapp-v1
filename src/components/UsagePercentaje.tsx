import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useAppState } from "@/AppState"
import numeral from 'numeral';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

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
    const [percentage, setPercentage] = useState<number>(0);
    const [thisMonthIngresos, setThisMonthIngresos] = useState<number>(0);
    const [thisMonthGastos, setThisMonthGastos] = useState<number>(0);
    const [thisRemanente, setRemanente] = useState<number>(0);
    const [topGastos, setTopGastos] = useState<any[]>([]);
    const [allTopGastos, setAllTopGastos] = useState<any[]>([]);
    const { apiPrefix, sessionId } = useAppState()
    const [isLoading, setIsLoading] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const fetchPercentage = async () => {
        setIsLoading(true)
        let params = new URLSearchParams();
        params.set("sessionHash", sessionId);
        const response = await fetch(`${apiPrefix}/curr-month-spending?${params.toString()}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())

        const gasto = response.data.find((o: any) => o.fk_tipoDoc == 1)
        const ingresos = response.data.find((o: any) => o.fk_tipoDoc == 3)
        if (!gasto || !ingresos) {
            setIsLoading(false)
            return
        }
        setThisMonthIngresos(ingresos.sumMonto)
        setThisMonthGastos(gasto.sumMonto)
        setRemanente(ingresos.sumMonto - gasto.sumMonto)

        setAllTopGastos(response.topGastos)
        setPercentage(response.porcentajeUsado)
        setIsLoading(false)
    };

    const calculateVisibleItems = () => {
        if (!listRef.current) return;

        const listHeight = listRef.current.clientHeight;
        // Each item is approximately 24px (text-sm line height + gap-1)
        const itemHeight = 24;
        const maxItems = Math.max(1, Math.floor(listHeight / itemHeight));
        const itemsToShow = Math.min(maxItems, allTopGastos.length);

        setTopGastos(allTopGastos.slice(0, itemsToShow));
    };

    useEffect(() => {
        fetchPercentage();
    }, []);

    useEffect(() => {
        if (allTopGastos.length > 0 && listRef.current) {
            // Use setTimeout to ensure DOM is fully rendered
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

    // Expose fetchData to parent through the ref
    useImperativeHandle(ref, () => ({
        refetchData: () => {
            fetchPercentage()
        },
    }))

    if (isLoading) {
        return (
            <Card className='h-full'  >
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
                        <Skeleton className="h-[50px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='h-full flex flex-col'>
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
                <div className='flex flex-col gap-1 truncate text-sm flex-1 overflow-hidden' ref={listRef}>
                    {topGastos.map((gasto, index) => (
                        <div key={index} className="flex justify-between w-full">
                            <span className="truncate block max-w-[8rem]">{gasto.proposito}</span>
                            <span>{numeral(gasto.monto).format('$0,0')}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default forwardRef(UsagePercentage)