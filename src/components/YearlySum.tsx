import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAppState } from "@/AppState"
import numeral from 'numeral';
import { Skeleton } from './ui/skeleton';
import { ArrowBigDownDash, ArrowBigUpDash, Minus } from 'lucide-react';
import { CardHeader, CardDescription, CardTitle, Card, CardContent } from './ui/card';
import { DateTime } from 'luxon';

function YearlySum(_props: unknown, ref: React.Ref<unknown>) {
  // const [percentage, setPercentage] = useState<number>(0);
  const [gastoSum, setGastoSum] = useState<number>(0);
  const [ingresoSum, setIngresoSum] = useState<number>(0);
  const [utilidadAnual, setUtilidadAnual] = useState<number>(0);
  const [montoUtilidad, setMontoUtilidad] = useState<number>(0);
  const [range, setRange] = useState<{ start: DateTime; end: DateTime }>({ start: DateTime.now(), end: DateTime.now() })
  const { apiPrefix, sessionId } = useAppState()
  const [isLoading, setIsLoading] = useState(true)

  const fetchPercentage = async () => {
    setIsLoading(true)
    let params = new URLSearchParams();
    params.set("sessionHash", sessionId);
    params.set("nMonths", "12");
    const response = await fetch(`${apiPrefix}/yearly-sum?${params.toString()}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    let gasto = response.data.find((o: any) => o.id == 1)
    let ingreso = response.data.find((o: any) => o.id == 3)
    // setPercentage(response.porcentajeUsado)
    setGastoSum(gasto.sumMonto)
    setIngresoSum(ingreso.sumMonto)
    setUtilidadAnual(100 - response.porcentajeUsado)
    setMontoUtilidad(ingreso.sumMonto - gasto.sumMonto)
    setRange({
      start: DateTime.fromFormat(response.range.start, "yyyy-MM-dd"),
      end: DateTime.fromFormat(response.range.end, "yyyy-MM-dd"),
    });
    setIsLoading(false)
  };

  useEffect(() => {
    fetchPercentage();
  }, []);

  // Expose fetchData to parent through the ref
  useImperativeHandle(ref, () => ({
    refetchData: () => {
      fetchPercentage()
    },
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
            <Skeleton className="h-[50px] w-full rounded-xl px-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[25px] w-full rounded-xl px-4" />
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