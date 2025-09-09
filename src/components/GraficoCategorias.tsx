import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig


interface GraficoCategoriasProps {
    onBarClick?: (catId: number) => void;
}

export interface GraficoCategoriasRef {
    refetchData?: () => void;
}


const GraficoCategoriasNew = forwardRef<GraficoCategoriasRef, GraficoCategoriasProps>(
    function GraficoCategorias(props, ref) {
        const { onBarClick } = props;
        const [chartData, setChartData] = useState([]);
        const [isLoading, setIsLoading] = useState(true)
        const [range, setRange] = useState<{ start: DateTime; end: DateTime }>({ start: DateTime.now(), end: DateTime.now() })
        const [hover, setHover] = useState<number | null>(null)
        const { apiPrefix, sessionId } = useAppState();

        const fetchData = async () => {
            try {
                // setIsLoading(true)
                const params = new URLSearchParams();
                params.set("sessionHash", sessionId);
                params.set("nMonths", "12");

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
                // We’ll use the `data` array from the response:
                // Each item has { label, data, catId }
                const newChartData = result.data.slice(0, 8).map((item: any) => ({
                    category: item.label, // e.g. "Vivienda"
                    amount: item.data, // e.g. 4283327
                    catId: item.catId, // optional if you need it for any additional logic
                }));

                setChartData(newChartData);
                setRange({
                    start: DateTime.fromFormat(result.range.start, "yyyy-MM-dd" ),
                    end: DateTime.fromFormat(result.range.end, "yyyy-MM-dd" ),
                });
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
            if (isLoading) {
                setIsLoading(false)
            }
        };

        useImperativeHandle(ref, () => ({
            refetchData: () => {
                fetchData()
            }
        }));

        useEffect(() => {
            fetchData();
        }, []);

        const handleBarClick = (data: any) => {
            if (onBarClick) {
                onBarClick(data.catId);
            }
        };

        if (isLoading) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos por Categorias</CardTitle>
                        <CardDescription>13 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="aspect-square" />
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gastos por Categorias</CardTitle>
                    <CardDescription>{range.start.toLocaleString({ month: 'long', year: 'numeric' })} - {range.end.toLocaleString({ month: 'long', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="aspect-square">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            layout="vertical"
                            margin={{
                                left: 25, right: 100 
                            }}
                        >
                            <XAxis type="number" dataKey="amount" hide />
                            <YAxis
                                dataKey="category"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                position={{ x: 70, y: -70 }}
                                content={<ChartTooltipContent className="w-48 text-base" formatter={(o: any) => (<div>{numeral(o).format("0,0")}</div>)} />}
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
                </CardContent>
            </Card>
        )
    }
)
export default GraficoCategoriasNew;