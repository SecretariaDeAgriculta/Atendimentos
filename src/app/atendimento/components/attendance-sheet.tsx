'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CounterInput } from './counter-input';
import { getDay, getDaysInMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

type AtendimentoData = {
  date: Date;
  presencial: number;
  telefone: number;
  whatsapp: number;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })
}));

const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
};

export function AttendanceSheet() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<AtendimentoData[]>([]);

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  
  const years = useMemo(() => getYears(), []);

  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const newData: AtendimentoData[] = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(selectedYear, selectedMonth, i + 1);
      return {
        date,
        presencial: 0,
        telefone: 0,
        whatsapp: 0,
      };
    });
    setData(newData);
  }, [currentDate]);

  const handleMonthChange = (monthValue: string) => {
    setCurrentDate(new Date(selectedYear, parseInt(monthValue, 10), 1));
  };

  const handleYearChange = (yearValue: string) => {
    setCurrentDate(new Date(parseInt(yearValue, 10), selectedMonth, 1));
  };

  const handleDataChange = (index: number, field: keyof Omit<AtendimentoData, 'date'>, value: number) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);
  };
  
  const handlePrint = () => {
    window.print();
  };

  const title = `ATENDIMENTOS - ${format(currentDate, 'MMMM / yyyy', { locale: ptBR }).toUpperCase()} - GERAL`;

  return (
    <div className="container mx-auto p-4 md:p-8 print-container">
      <Card className="print-card">
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between print-hidden">
            <CardTitle className="text-xl md:text-2xl whitespace-nowrap font-headline">{title}</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
                <Select value={String(selectedMonth)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map(month => (
                            <SelectItem key={month.value} value={String(month.value)}>{month.label.charAt(0).toUpperCase() + month.label.slice(1)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handlePrint} variant="outline" className="ml-auto">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
            </div>
        </CardHeader>
        <h2 className="print-show print-title">{title}</h2>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto print-table border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] border-r">Data</TableHead>
                  <TableHead className="border-r">Atendimento Presencial</TableHead>
                  <TableHead className="border-r">Atendimento Telefone</TableHead>
                  <TableHead>Atendimento WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((dayData, index) => {
                  const dayOfWeek = getDay(dayData.date);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  return (
                    <TableRow key={index} className={cn(isWeekend && 'bg-muted')}>
                      <TableCell className="font-medium whitespace-nowrap date-cell border-r">
                        {format(dayData.date, 'dd/MMM', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="print-hidden">
                            <CounterInput
                            value={dayData.presencial}
                            onChange={(v) => handleDataChange(index, 'presencial', v)}
                            disabled={isWeekend}
                            />
                        </div>
                        <span className="print-show">{dayData.presencial}</span>
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="print-hidden">
                            <CounterInput
                            value={dayData.telefone}
                            onChange={(v) => handleDataChange(index, 'telefone', v)}
                            disabled={isWeekend}
                            />
                        </div>
                        <span className="print-show">{dayData.telefone}</span>
                      </TableCell>
                      <TableCell>
                        <div className="print-hidden">
                            <CounterInput
                            value={dayData.whatsapp}
                            onChange={(v) => handleDataChange(index, 'whatsapp', v)}
                            disabled={isWeekend}
                            />
                        </div>
                        <span className="print-show">{dayData.whatsapp}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
