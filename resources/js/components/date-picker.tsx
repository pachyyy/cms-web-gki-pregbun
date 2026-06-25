import { format, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    id?: string;
    /** Stored value as `yyyy-MM-dd` (or empty string when unset). */
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function DatePicker({ id, value, onChange, placeholder = 'Pilih tanggal' }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !selected && 'text-muted-foreground')}
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {selected ? format(selected, 'd MMMM yyyy', { locale: localeId }) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    defaultMonth={selected}
                    onSelect={(date) => {
                        if (date) {
                            onChange(format(date, 'yyyy-MM-dd'));
                            setOpen(false);
                        }
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
