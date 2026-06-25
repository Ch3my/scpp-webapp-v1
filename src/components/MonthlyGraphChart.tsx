import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { DateTime, Settings } from "luxon";
import {
    ChartConfig,
    ChartContainer,
} from "@/components/ui/chart"
import { Skeleton } from "./ui/skeleton";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

Settings.defaultLocale = "es";

const chartConfig = {
    gastos: {
        label: "Gastos",
        color: "oklch(0.65 0.2 27)", // red
    },
    ingresos: {
        label: "Ingresos",
        color: "oklch(0.55 0.15 250)", // blue
    },
    ahorros: {
        label: "Ahorros",
        color: "oklch(0.8 0.15 85)", // yellow
    },
} satisfies ChartConfig

function MonthlyGraphChart(_props: unknown, ref: React.Ref<unknown>) {
    const [nMonths, setNMonths] = useState<number>(13);
    const [offset, setOffset] = useState<number>(0);
    const [debouncedNMonths, setDebouncedNMonths] = useState<number>(13);
    const [debouncedOffset, setDebouncedOffset] = useState<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedNMonths(nMonths), 400);
        return () => clearTimeout(timer);
    }, [nMonths]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedOffset(offset), 400);
        return () => clearTimeout(timer);
    }, [offset]);

    const { data: monthlyGraphData, isLoading, refetch } = useQuery({
        queryKey: ['dashboard', 'monthly-graph', debouncedNMonths, debouncedOffset],
        queryFn: async () => {
            const { data } = await api.get(`/monthly-graph?nMonths=${debouncedNMonths}&offset=${debouncedOffset}`);
            return data;
        },
    });

    // Keep ref for backwards compatibility
    useImperativeHandle(ref, () => ({
        refetchData: () => refetch(),
    }))

    const safeData = monthlyGraphData ?? { labels: [], gastosDataset: [], ingresosDataset: [], ahorrosDataset: [] };

    const chartData = safeData.labels.map((label: string, index: number) => {
        const dt = DateTime.fromFormat(label, "yyyy-MM");
        return {
            month: dt.toFormat("MMMM").slice(0, 3),
            year: dt.toFormat("yyyy"),
            gastos: safeData.gastosDataset[index],
            ingresos: safeData.ingresosDataset[index],
            ahorros: safeData.ahorrosDataset[index],
        };
    });

    // Calculate the max value across all datasets for a dynamic Y-axis domain
    const allDataValues = [
        ...safeData.gastosDataset,
        ...safeData.ingresosDataset,
        ...safeData.ahorrosDataset,
    ];
    const dataMax = Math.max(...allDataValues);
    const yAxisDomainMax = Math.round(dataMax * 1.1); // Add a 10% buffer

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historico financiero</CardTitle>
                <CardDescription>
                    {safeData.range
                        ? `${DateTime.fromISO(safeData.range.start).toFormat("MMM yyyy")} – ${DateTime.fromISO(safeData.range.end).toFormat("MMM yyyy")}`
                        : `${nMonths} meses`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="aspect-video w-full" />
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-video">
                        <LineChart
                            data={chartData}
                            margin={{ left: 12, right: 24, top: 24, bottom: 12 }}
                            accessibilityLayer
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                domain={[0, yAxisDomainMax]}
                                scale={"linear"}
                                tickFormatter={(value) => numeral(value).format("0,0")}
                            />
                            <Tooltip
                                shared={false}
                                offset={30}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const year = payload[0]?.payload?.year;
                                        return (
                                            <div className="rounded-lg border border-muted-foreground bg-background p-3 text-base">
                                                <span className="font-medium text-foreground uppercase">
                                                    {label}{year ? ` ${year}` : ''}
                                                </span>
                                                {payload.map((entry, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 mr-2">
                                                            <div
                                                                className="h-2 w-2 shrink-0 rounded-sm"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-muted-foreground capitalize">
                                                                {entry.name}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-foreground">
                                                            {numeral(entry.value).format("0,0")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                dataKey="gastos"
                                type="monotone"
                                stroke="var(--color-gastos)"
                                strokeWidth={2}
                                dot={{ fill: "var(--color-gastos)" }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                dataKey="ingresos"
                                type="monotone"
                                stroke="var(--color-ingresos)"
                                strokeWidth={2}
                                dot={{ fill: "var(--color-ingresos)" }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                dataKey="ahorros"
                                type="monotone"
                                stroke="var(--color-ahorros)"
                                strokeWidth={2}
                                dot={{ fill: "var(--color-ahorros)" }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ChartContainer>
                )}
                <div className="mt-4 flex gap-6">
                    <div className="flex-1 flex items-center gap-3">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Meses: {nMonths}
                        </span>
                        <Slider
                            value={[nMonths]}
                            onValueChange={(value) => setNMonths(value[0])}
                            min={3}
                            max={24}
                            step={1}
                            className="flex-1 [&>span:first-child]:h-1.5 **:[[role=slider]]:h-4 **:[[role=slider]]:w-4 **:[[role=slider]]:border **:[[role=slider]]:transition-transform [&_[role=slider]:hover]:scale-125"
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Ventana: {offset > 0 ? '+' : ''}{offset}
                        </span>
                        <Slider
                            value={[offset]}
                            onValueChange={(value) => setOffset(value[0])}
                            min={-36}
                            max={12}
                            step={1}
                            className="flex-1 [&>span:first-child]:h-1.5 **:[[role=slider]]:h-4 **:[[role=slider]]:w-4 **:[[role=slider]]:border **:[[role=slider]]:transition-transform [&_[role=slider]:hover]:scale-125"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
export default forwardRef(MonthlyGraphChart)