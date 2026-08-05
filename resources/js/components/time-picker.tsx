import { Clock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TimePickerProps {
    id?: string;
    /** Stored value as 24-hour `HH:mm` (or empty string when unset). */
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
}

export function TimePicker({ id, value, onChange, disabled, className, ...rest }: TimePickerProps) {
    return (
        <div className={cn('relative', className)}>
            <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
                id={id}
                type="time"
                // step=60 keeps browsers from emitting an "HH:mm:ss" value.
                step={60}
                disabled={disabled}
                value={value}
                // slice(0,5) is belt-and-braces: the wire format must stay H:i
                // to match the date_format:H:i validation rule server-side.
                onChange={(e) => onChange(e.target.value.slice(0, 5))}
                className="pl-9 [&::-webkit-calendar-picker-indicator]:opacity-60 dark:[&::-webkit-calendar-picker-indicator]:invert"
                {...rest}
            />
        </div>
    );
}
