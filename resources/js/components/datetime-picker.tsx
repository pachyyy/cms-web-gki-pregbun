import { DatePicker } from '@/components/date-picker';
import { TimePicker } from '@/components/time-picker';
import { cn } from '@/lib/utils';

export interface DateTimeValue {
    /** `yyyy-MM-dd`, or empty string when unset. */
    date: string;
    /** 24-hour `HH:mm`, or empty string when unset. */
    time: string;
}

interface DateTimePickerProps {
    id?: string;
    value: DateTimeValue;
    onChange: (value: DateTimeValue) => void;
    datePlaceholder?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Calendar popover + time field, side by side. The two halves stay separate
 * scalars on the wire (`event_date` + `start_time`) rather than one combined
 * timestamp: `events.event_date` is a Postgres `date` and `events.start_time`
 * a `time`, and round-tripping them through a JS Date would silently shift
 * the date across the UTC boundary for early-morning events.
 */
export function DateTimePicker({ id, value, onChange, datePlaceholder = 'Pilih tanggal', disabled, className }: DateTimePickerProps) {
    return (
        <div className={cn('flex gap-2', className)}>
            <div className="min-w-0 flex-1">
                <DatePicker id={id} value={value.date} placeholder={datePlaceholder} onChange={(date) => onChange({ ...value, date })} />
            </div>
            <TimePicker
                aria-label="Jam mulai"
                value={value.time}
                onChange={(time) => onChange({ ...value, time })}
                disabled={disabled}
                className="w-32 shrink-0"
            />
        </div>
    );
}
