import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { DateTime } from "luxon"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useAppState } from "@/AppState"
import numeral from "numeral"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

function CategoriasRadial(_props: unknown, ref: React.Ref<unknown>) {
    const [fechaInicio, _] = useState(DateTime.now());
    const { apiPrefix, sessionId } = useAppState();
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        try {
            const params = new URLSearchParams();
            params.set("sessionHash", sessionId);
            params.set("nMonths", "0");

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
            const newChartData = result.data.slice(0, 6).map((item: any) => ({
                category: item.label,
                amount: item.data, // e.g. 4283327
                catId: item.catId, // optional if you need it for any additional logic
            }));

            setChartData(newChartData);
        } catch (error) {
            console.error("Error fetching chart data:", error);
        }
        if (isLoading) {
            setIsLoading(false)
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Expose fetchData to parent through the ref
    useImperativeHandle(ref, () => ({
        refetchData: () => {
            fetchData()
        },
    }))

    if (isLoading) {
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Categorias {fechaInicio.toFormat("MMMM")}</CardTitle>
                <CardDescription>6 categorias principales</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="aspect-video rounded-full" />
            </CardContent>
        </Card>
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Categorias {fechaInicio.toFormat("MMMM")}</CardTitle>
                <CardDescription>6 categorias principales</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="aspect-video"
                >
                    <RadarChart data={chartData}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent className="text-base" formatter={(value) => <p>$ {numeral(value).format("0,0")}</p>} />}
                        />
                        <PolarGrid gridType="circle" />
                        <PolarAngleAxis dataKey="category" />
                        <Radar
                            dataKey="amount"
                            fill="var(--color-desktop)"
                            fillOpacity={0.6}
                            dot={{
                                r: 4,
                                fillOpacity: 1,
                            }}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default forwardRef(CategoriasRadial)