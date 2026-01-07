import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useAppState } from "@/AppState";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "./ui/skeleton";
import numeral from "numeral";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DateTime } from "luxon";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Slider } from "./ui/slider";

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig


interface GraficoCategoriasProps {
    onBarClick?: (catId: number, nMonths: number) => void;
}

export interface GraficoCategoriasRef {
    refetchData?: () => void;
}

interface ChartDataItem {
    category: string;
    amount: number;
    catId: number;
}


const MIN_CATEGORIES = 3;

const GraficoCategoriasNew = forwardRef<GraficoCategoriasRef, GraficoCategoriasProps>(
    function GraficoCategorias(props, ref) {
        const { onBarClick } = props;
        const [hover, setHover] = useState<number | null>(null)
        const [nMonths, setNMonths] = useState<number>(3);
        const [visibleCount, setVisibleCount] = useState<number | null>(null);
        const { apiPrefix, sessionId } = useAppState();

        const fetchData = async () => {
            const params = new URLSearchParams();
            params.set("sessionHash", sessionId);
            params.set("nMonths", nMonths.toString());

            const response = await fetch(
                `${apiPrefix}/expenses-by-category?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const result = await response.json();

            // Transform the raw data into the shape Recharts needs
            // We'll use the `data` array from the response:
            // Each item has { label, data, catId }
            const chartData: ChartDataItem[] = result.data.map((item: any) => ({
                category: item.label, // e.g. "Vivienda"
                amount: item.data, // e.g. 4283327
                catId: item.catId, // optional if you need it for any additional logic
            }));

            const range = {
                start: DateTime.fromFormat(result.range.start, "yyyy-MM-dd"),
                end: DateTime.fromFormat(result.range.end, "yyyy-MM-dd"),
            };

            return { chartData, range };
        };

        const { data, isLoading, refetch } = useQuery({
            queryKey: ['expenses-by-category', sessionId, nMonths],
            queryFn: fetchData,
        });

        const allChartData = data?.chartData || [];
        const range = data?.range || { start: DateTime.now(), end: DateTime.now() };

        // Calculate the actual visible count: use state if set, otherwise 60% of total
        const totalCategories = allChartData.length;
        const effectiveVisibleCount = useMemo(() => {
            if (visibleCount !== null) return visibleCount;
            if (totalCategories === 0) return MIN_CATEGORIES;
            return Math.max(MIN_CATEGORIES, Math.round(totalCategories * 0.6));
        }, [visibleCount, totalCategories]);

        // Slice the data to show only the visible categories
        const chartData = useMemo(() => {
            return allChartData.slice(0, effectiveVisibleCount);
        }, [allChartData, effectiveVisibleCount]);

        useImperativeHandle(ref, () => ({
            refetchData: () => {
                refetch()
            }
        }));

        const handleBarClick = (data: any) => {
            if (onBarClick) {
                onBarClick(data.catId, nMonths);
            }
        };

        if (isLoading) {
            return (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Gastos por Categorias</CardTitle>
                            <ButtonGroup>
                                <Button
                                    variant={nMonths === 3 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setNMonths(3)}
                                    className="h-6 px-2 text-xs"
                                >
                                    3M
                                </Button>
                                <Button
                                    variant={nMonths === 6 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setNMonths(6)}
                                    className="h-6 px-2 text-xs"
                                >
                                    6M
                                </Button>
                                <Button
                                    variant={nMonths === 13 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setNMonths(13)}
                                    className="h-6 px-2 text-xs"
                                >
                                    13M
                                </Button>
                            </ButtonGroup>
                        </div>
                        <CardDescription>{nMonths} meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="aspect-square" />
                    </CardContent>
                </Card>
            )
        }

        const maxAmount = chartData.reduce(
            (max, item) => Math.max(max, item.amount),
            0
        );
        const xAxisDomainMax = maxAmount * 1.1; // 10% buffer

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Gastos por Categorias</CardTitle>
                        <ButtonGroup>
                            <Button
                                variant={nMonths === 3 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNMonths(3)}
                                className="h-6 px-2 text-xs"
                            >
                                3M
                            </Button>
                            <Button
                                variant={nMonths === 6 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNMonths(6)}
                                className="h-6 px-2 text-xs"
                            >
                                6M
                            </Button>
                            <Button
                                variant={nMonths === 12 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNMonths(12)}
                                className="h-6 px-2 text-xs"
                            >
                                13M
                            </Button>
                        </ButtonGroup>
                    </div>
                    <CardDescription>{range.start.toLocaleString({ month: 'long', year: 'numeric' })} - {range.end.toLocaleString({ month: 'long', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="aspect-square">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            layout="vertical"
                            margin={{
                                left: 25
                            }}
                        >
                            <XAxis type="number" dataKey="amount" hide domain={[0, xAxisDomainMax]} />
                            <YAxis
                                dataKey="category"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                offset={25}
                                // position={{ x: 70, y: -70 }}
                                content={<ChartTooltipContent className="w-fit text-base border border-muted-foreground" formatter={(o: any) => (<div>{numeral(o).format("0,0")}</div>)} />}
                            />
                            <Bar dataKey="amount" fill="var(--color-desktop)" onClick={handleBarClick} shape={(props: any) => {
                                return (<rect
                                    fill={props.fill}
                                    height={props.height}
                                    width={props.width}
                                    x={props.x}
                                    y={props.y}
                                    onMouseEnter={() => setHover(props.index)}
                                    onMouseLeave={() => setHover(null)}
                                    style={{
                                        filter: hover === props.index ? 'brightness(1.5)' : 'none',
                                        transition: 'filter 0.2s ease',
                                    }}
                                    rx={5}
                                />
                                )
                            }} />
                        </BarChart>
                    </ChartContainer>
                    {totalCategories > MIN_CATEGORIES && (
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {effectiveVisibleCount} / {totalCategories}
                            </span>
                            <Slider
                                value={[effectiveVisibleCount]}
                                onValueChange={(value) => setVisibleCount(value[0])}
                                min={MIN_CATEGORIES}
                                max={totalCategories}
                                step={1}
                                className="flex-1 [&>span:first-child]:h-1.5 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border [&_[role=slider]]:transition-transform [&_[role=slider]:hover]:scale-125"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }
)
export default GraficoCategoriasNew;