import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"
import { DateTime, Settings } from "luxon";
import { useAppState } from "@/AppState"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";

Settings.defaultLocale = "es";

interface CategoryDataset {
    label: string;
    categoryId: number;
    data: number[];
}

interface ExpensesByCategoryResponse {
    labels: string[];
    datasets: CategoryDataset[];
    range: {
        start: string;
        end: string;
    };
}

const CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

interface ExpensesByCategoryTimeseriesChartProps {
    filterTopN?: number;
}

function ExpensesByCategoryTimeseriesChart(props: ExpensesByCategoryTimeseriesChartProps, ref: React.Ref<unknown>) {
    const { filterTopN } = props;
    const { apiPrefix, sessionId } = useAppState()
    const [activeChart, setActiveChart] = useState<string>("")
    const [nMonths, setNMonths] = useState<number>(9)

    const { data: expensesData, isLoading, refetch } = useQuery<ExpensesByCategoryResponse>({
        queryKey: ['dashboard', 'expenses-by-category-timeseries', nMonths],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("sessionHash", sessionId);
            params.set("nMonths", nMonths.toString());
            const response = await fetch(`${apiPrefix}/expenses-by-category-timeseries?${params.toString()}`, {
                method: "GET",
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        },
    });

    const safeExpensesData = expensesData ?? { labels: [], datasets: [], range: { start: "", end: "" } };

    // Keep ref for backwards compatibility
    useImperativeHandle(ref, () => ({
        refetchData: () => refetch(),
    }))

    // Filter and sort datasets by total amount
    const filteredDatasets = useMemo(() => {
        // Calculate total for each category
        const datasetsWithTotal = safeExpensesData.datasets.map(dataset => ({
            ...dataset,
            total: dataset.data.reduce((sum, value) => sum + value, 0)
        }));

        // Sort by total descending
        const sortedDatasets = datasetsWithTotal.sort((a, b) => b.total - a.total);

        // Filter top N if specified
        if (filterTopN && filterTopN > 0) {
            return sortedDatasets.slice(0, filterTopN);
        }

        return sortedDatasets;
    }, [safeExpensesData.datasets, filterTopN]);

    // Set active chart to first category when data loads
    useEffect(() => {
        if (filteredDatasets.length > 0 && !activeChart) {
            setActiveChart(`category_${filteredDatasets[0].categoryId}`);
        }
    }, [filteredDatasets, activeChart]);

    // Calculate totals for each category
    const totals = useMemo(() => {
        return filteredDatasets.reduce((acc, dataset) => {
            acc[`category_${dataset.categoryId}`] = dataset.data.reduce((sum, value) => sum + value, 0);
            return acc;
        }, {} as Record<string, number>);
    }, [filteredDatasets]);

    // Build dynamic chart config based on filtered datasets
    const chartConfig: ChartConfig = useMemo(() => {
        return filteredDatasets.reduce((config, dataset, index) => {
            config[`category_${dataset.categoryId}`] = {
                label: dataset.label,
                color: CHART_COLORS[index % CHART_COLORS.length],
            };
            return config;
        }, {} as ChartConfig);
    }, [filteredDatasets]);

    // Transform data for Recharts
    const chartData = useMemo(() => {
        return safeExpensesData.labels.map((label: string, index: number) => {
            const monthName = DateTime.fromFormat(label, "yyyy-MM").toFormat("MMMM").slice(0, 3);
            const dataPoint: any = { month: monthName, monthLabel: label };

            filteredDatasets.forEach((dataset) => {
                dataPoint[`category_${dataset.categoryId}`] = dataset.data[index];
            });

            return dataPoint;
        });
    }, [safeExpensesData.labels, filteredDatasets]);

    if (isLoading) {
        return (
            <Card className="py-4 sm:py-0">
                <CardHeader>
                    <CardTitle>Gastos por categoría</CardTitle>
                    <CardDescription>{nMonths} meses</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="py-4 sm:py-0">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
                    <CardTitle className="flex items-center gap-2">
                        Gastos por categoría
                    </CardTitle>
                    <CardDescription>
                        <ButtonGroup className="mt-1 mb-1">
                            <Button
                                variant={nMonths === 13 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNMonths(13)}
                                className="h-6 px-2 text-xs"
                            >
                                13M
                            </Button>
                            <Button
                                variant={nMonths === 9 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNMonths(9)}
                                className="h-6 px-2 text-xs"
                            >
                                9M
                            </Button>
                        </ButtonGroup>
                    </CardDescription>
                </div>
                <div className="flex overflow-x-auto">
                    {filteredDatasets.map((dataset) => {
                        const key = `category_${dataset.categoryId}`;
                        return (
                            <button
                                key={key}
                                data-active={activeChart === key}
                                className="data-[active=true]:bg-muted/50 flex flex-col justify-center gap-1 border-t px-3 py-2 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 flex-shrink-0"
                                onClick={() => setActiveChart(key)}
                            >
                                <span className="text-muted-foreground">
                                    {chartConfig[key]?.label}
                                </span>
                                <span className="text-xl leading-none font-semibold">
                                    {numeral(totals[key]).format("0,0")}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[200px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 30,
                            left: 50,
                            right: 50,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={50}
                            tickFormatter={(value) => numeral(value).format("0,0")}
                        />
                        <ChartTooltip
                            cursor={false}
                            offset={25}
                            content={<ChartTooltipContent className="w-fit text-base uppercase border border-muted-foreground" formatter={(o: any) => (<div>{numeral(o).format("0,0")}</div>)} />}
                        />
                        <Line
                            dataKey={activeChart}
                            type="natural"
                            stroke={`var(--color-${activeChart})`}
                            strokeWidth={2}
                            dot={{
                                fill: `var(--color-${activeChart})`,
                            }}
                            activeDot={{
                                r: 6,
                            }}
                        >
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={14}
                                formatter={(value: number) => numeral(value).format("0,0")}
                            />
                        </Line>
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default forwardRef(ExpensesByCategoryTimeseriesChart)
