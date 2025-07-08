'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import { CounterInput } from './counter-input';
import {
  getDay,
  getDaysInMonth,
  format,
  startOfMonth,
  endOfMonth,
  formatISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';

type AtendimentoData = {
  date: Date;
  presencial: number;
  telefone: number;
  whatsapp: number;
};

interface AttendanceSheetProps {
  user: User;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(2000, i).toLocaleString('pt-BR', { month: 'long' }),
}));

export function AttendanceSheet({ user }: AttendanceSheetProps) {
  const getInitialDate = () => {
    const date = new Date();
    date.setFullYear(2025);
    return date;
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [data, setData] = useState<AtendimentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    if (user) {
      setEmployeeName(user.user_metadata.full_name || user.email || '');
    }
  }, [user]);

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const [yearInput, setYearInput] = useState(String(selectedYear));

  useEffect(() => {
    setYearInput(String(currentDate.getFullYear()));
  }, [currentDate]);

  const fetchAndSetData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const daysInMonth = getDaysInMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const { data: supabaseData, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', formatISO(startDate, { representation: 'date' }))
      .lte('date', formatISO(endDate, { representation: 'date' }));

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar os dados',
        description:
          'Não foi possível buscar os atendimentos. Verifique sua conexão ou a configuração do Supabase.',
      });
      setLoading(false);
      return;
    }

    const dataMap = new Map(supabaseData.map((d) => [d.date, d]));

    const fullMonthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const dateString = formatISO(date, { representation: 'date' });
      const existingData = dataMap.get(dateString);

      return {
        date,
        presencial: existingData?.presencial ?? 0,
        telefone: existingData?.telefone ?? 0,
        whatsapp: existingData?.whatsapp ?? 0,
      };
    });

    setData(fullMonthData);
    setLoading(false);
  }, [currentDate, toast, user]);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  const handleMonthChange = (monthValue: string) => {
    setCurrentDate(new Date(selectedYear, parseInt(monthValue, 10), 1));
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setYearInput(value);
  };

  const updateYear = () => {
    const year = parseInt(yearInput, 10);
    if (yearInput.length === 4 && !isNaN(year) && year > 1900 && year < 2100) {
      setCurrentDate(new Date(year, selectedMonth, 1));
    } else {
      toast({
        variant: 'destructive',
        title: 'Ano inválido',
        description: 'Por favor, insira um ano com 4 dígitos.',
      });
      setYearInput(String(selectedYear)); // Revert to last valid year
    }
  };

  const handleYearInputBlur = () => {
    if (yearInput !== String(selectedYear)) {
      updateYear();
    }
  };

  const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (yearInput !== String(selectedYear)) {
        updateYear();
      }
      e.currentTarget.blur();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeName(e.target.value);
  };
  
  const updateUserName = async () => {
    const currentName = user?.user_metadata?.full_name || user?.email || '';
    if (employeeName === currentName || !employeeName.trim()) {
      if (!employeeName.trim()) setEmployeeName(currentName);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: employeeName },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar nome',
        description: error.message,
      });
      setEmployeeName(currentName);
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Nome do funcionário atualizado.',
      });
    }
  };

  const handleNameInputBlur = () => {
    updateUserName();
  };

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateUserName();
      e.currentTarget.blur();
    }
  };

  const handleDataChange = async (
    index: number,
    field: keyof Omit<AtendimentoData, 'date'>,
    value: number
  ) => {
    if (!user) return;
    const originalData = JSON.parse(JSON.stringify(data));
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);

    const recordToUpsert = {
      date: formatISO(newData[index].date, { representation: 'date' }),
      presencial: newData[index].presencial,
      telefone: newData[index].telefone,
      whatsapp: newData[index].whatsapp,
      user_id: user.id,
    };

    const { error } = await supabase
      .from('attendances')
      .upsert(recordToUpsert, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Error upserting data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a alteração. Revertendo.',
      });
      setData(originalData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = useMemo(() => {
    const presencial = data.reduce((acc, curr) => acc + (curr.presencial || 0), 0);
    const telefone = data.reduce((acc, curr) => acc + (curr.telefone || 0), 0);
    const whatsapp = data.reduce((acc, curr) => acc + (curr.whatsapp || 0), 0);
    const geral = presencial + telefone + whatsapp;
    return { presencial, telefone, whatsapp, geral };
  }, [data]);

  const title = `ATENDIMENTOS - ${format(
    currentDate,
    'MMMM / yyyy',
    { locale: ptBR }
  ).toUpperCase()} - GERAL`;

  return (
    <div className="container mx-auto p-4 md:p-8 print-container">
      <Card className="print-card">
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between print-hidden">
          <div className="flex-grow">
            <CardTitle className="text-xl md:text-2xl whitespace-nowrap font-headline">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <strong className="text-sm font-medium whitespace-nowrap">Funcionário:</strong>
              <Input
                  type="text"
                  value={employeeName}
                  onChange={handleNameChange}
                  onBlur={handleNameInputBlur}
                  onKeyDown={handleNameInputKeyDown}
                  className="h-8"
                  placeholder="Nome do funcionário"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select
              value={String(selectedMonth)}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem
                    key={month.value}
                    value={String(month.value)}
                  >
                    {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearInput}
              onChange={handleYearInputChange}
              onBlur={handleYearInputBlur}
              onKeyDown={handleYearInputKeyDown}
              className="w-full sm:w-[120px]"
              maxLength={4}
              placeholder="Ano"
            />
            <Button onClick={handlePrint} variant="outline" className="ml-auto">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <h2 className="print-show print-title">{title}</h2>
        <p className="print-show text-center text-sm mb-4 -mt-3"><strong>Funcionário:</strong> {employeeName}</p>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto print-table border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] border-r">Data</TableHead>
                  <TableHead className="border-r">
                    Atendimento Presencial
                  </TableHead>
                  <TableHead className="border-r">
                    Atendimento Telefone
                  </TableHead>
                  <TableHead>Atendimento WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 10 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium whitespace-nowrap date-cell border-r">
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell className="border-r">
                          <Skeleton className="h-8 w-32 mx-auto" />
                        </TableCell>
                        <TableCell className="border-r">
                          <Skeleton className="h-8 w-32 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-32 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : data.map((dayData, index) => {
                      const dayOfWeek = getDay(dayData.date);
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <TableRow
                          key={index}
                          className={cn(isWeekend && 'bg-slate-300')}
                        >
                          <TableCell className="font-medium whitespace-nowrap date-cell border-r">
                            {format(dayData.date, 'dd/MMM', {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="border-r">
                            <div className="print-hidden">
                              <CounterInput
                                value={dayData.presencial}
                                onChange={(v) =>
                                  handleDataChange(index, 'presencial', v)
                                }
                                disabled={isWeekend}
                              />
                            </div>
                            <span className="print-show">
                              {dayData.presencial}
                            </span>
                          </TableCell>
                          <TableCell className="border-r">
                            <div className="print-hidden">
                              <CounterInput
                                value={dayData.telefone}
                                onChange={(v) =>
                                  handleDataChange(index, 'telefone', v)
                                }
                                disabled={isWeekend}
                              />
                            </div>
                            <span className="print-show">
                              {dayData.telefone}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="print-hidden">
                              <CounterInput
                                value={dayData.whatsapp}
                                onChange={(v) =>
                                  handleDataChange(index, 'whatsapp', v)
                                }
                                disabled={isWeekend}
                              />
                            </div>
                            <span className="print-show">
                              {dayData.whatsapp}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-slate-100 font-medium hover:bg-slate-100/80">
                  <TableCell className="border-r font-bold">Total</TableCell>
                  <TableCell className="text-center font-bold border-r">{totals.presencial}</TableCell>
                  <TableCell className="text-center font-bold border-r">{totals.telefone}</TableCell>
                  <TableCell className="text-center font-bold">{totals.whatsapp}</TableCell>
                </TableRow>
                <TableRow className="bg-slate-200 font-medium hover:bg-slate-200/80">
                  <TableCell className="border-r font-bold">Total Geral</TableCell>
                  <TableCell colSpan={3} className="text-center font-bold">{totals.geral}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
