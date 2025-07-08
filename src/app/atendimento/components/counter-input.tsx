'use client';

import { useState, type FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface CounterInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const CounterInput: FC<CounterInputProps> = ({ value, onChange, disabled }) => {
  const [internalValue, setInternalValue] = useState(String(value));

  useEffect(() => {
    setInternalValue(String(value));
  }, [value]);

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = (value || 0) + 1;
    onChange(newValue);
  };

  const handleDecrement = () => {
    if (disabled || value <= 0) return;
    const newValue = (value || 0) - 1;
    onChange(newValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const validateAndSubmit = (inputValue: string) => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
      setInternalValue(String(num));
    } else {
      setInternalValue(String(value));
    }
  };

  const handleBlur = () => {
    validateAndSubmit(internalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      validateAndSubmit(internalValue);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInternalValue(String(value));
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full transition-colors duration-200 hover:bg-accent focus-visible:bg-accent disabled:opacity-50"
        onClick={handleDecrement}
        disabled={disabled || value <= 0}
        aria-label="Diminuir"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="h-8 w-16 text-center tabular-nums"
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Quantidade de atendimentos"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full transition-colors duration-200 hover:bg-accent focus-visible:bg-accent disabled:opacity-50"
        onClick={handleIncrement}
        disabled={disabled}
        aria-label="Aumentar"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
