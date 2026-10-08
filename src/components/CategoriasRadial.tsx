import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { DateTime } from "luxon"
import { forwardRef, useImperativeHandle } from "react"
import numeral from "numeral"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useMemo } from "react"
import { useExpensesByCategory } from "@/api/hooks"

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

function CategoriasRadial(_props: unknown, ref: React.Ref<unknown>) {
    const fechaInicio = DateTime.now();

    // nMonths=0 means the current month only
    const { data: result, isLoading, refetch } = useExpensesByCategory(0);

    const chartData = useMemo(
        () => (result?.data ?? []).slice(0, 6).map((item) => ({
            category: item.label,
            amount: item.data,
            catId: item.catId,
        })),
        [result]
    );

    // Keep ref for backwards compatibility
    useImperativeHandle(ref, () => ({
        refetchData: () => refetch(),
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