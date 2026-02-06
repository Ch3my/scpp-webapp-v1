import React, { forwardRef, useImperativeHandle } from 'react';
import numeral from 'numeral';
import { Skeleton } from './ui/skeleton';
import { ArrowBigDownDash, ArrowBigUpDash, Minus } from 'lucide-react';
import { CardHeader, CardDescription, CardTitle, Card, CardContent } from './ui/card';
import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import api from "@/lib/api";

function YearlySum(_props: unknown, ref: React.Ref<unknown>) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'yearly-sum'],
    queryFn: async () => {
      const { data: result } = await api.get("/yearly-sum?nMonths=12");

      const gasto = result.data.find((o: any) => o.id == 1);
      const ingreso = result.data.find((o: any) => o.id == 3);

      return {
        gastoSum: gasto.sumMonto,
        ingresoSum: ingreso.sumMonto,
        utilidadAnual: 100 - result.porcentajeUsado,
        montoUtilidad: ingreso.sumMonto - gasto.sumMonto,
        range: {
          start: DateTime.fromFormat(result.range.start, "yyyy-MM-dd"),
          end: DateTime.fromFormat(result.range.end, "yyyy-MM-dd"),
        },
      };
    },
  });

  const gastoSum = data?.gastoSum ?? 0;
  const ingresoSum = data?.ingresoSum ?? 0;
  const utilidadAnual = data?.utilidadAnual ?? 0;
  const montoUtilidad = data?.montoUtilidad ?? 0;
  const range = data?.range ?? { start: DateTime.now(), end: DateTime.now() };

  // Keep ref for backwards compatibility
  useImperativeHandle(ref, () => ({
    refetchData: () => refetch(),
  }))

  const getIcon = () => {
    if (montoUtilidad > 0) {
      return <ArrowBigUpDash size={32} className="text-green-600" />
    }
    if (montoUtilidad < 0) {
      return <ArrowBigDownDash size={32} className=' text-red-600' />
    }
    return <Minus />
  }

  if (isLoading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardDescription>Utilidad 13 meses</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <Skeleton className="h-12.5 w-full rounded-xl px-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-6.25 w-full rounded-xl px-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full px-4" />
              <Skeleton className="h-4 w-full px-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardDescription className='grid'>
          <span>Utilidad</span>
          <span>{range.start.toLocaleString({ month: 'short', year: '2-digit' })} - {range.end.toLocaleString({ month: 'short', year: '2-digit' })}</span>
        </CardDescription>
        <div className='grid grid-cols-2 justify-between items-center' style={{ gridTemplateColumns: '1fr 3fr' }}>
          <div>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {numeral(utilidadAnual).format("0,0.0")}%
            </CardTitle>
            <span className='text-sm'>${numeral(montoUtilidad).format("0,0")}</span>
          </div>
          <div className='justify-self-end'>
            {getIcon()}
          </div>

        </div>
      </CardHeader>
      <CardContent className='grid gap-2'>
        <div>
          <p className="text-muted-foreground">Ingresos</p>
          <p>${numeral(ingresoSum).format("0,0")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Egresos</p>
          <p>${numeral(gastoSum).format("0,0")}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default forwardRef(YearlySum)