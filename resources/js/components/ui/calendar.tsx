import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'relative flex flex-col gap-4 sm:flex-row',
                month: 'flex w-full flex-col gap-4',
                month_caption: 'flex h-7 items-center justify-center',
                caption_label: 'text-sm font-medium',
                nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                button_previous: cn(buttonVariants({ variant: 'outline' }), 'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'),
                button_next: cn(buttonVariants({ variant: 'outline' }), 'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 text-[0.8rem] font-normal text-muted-foreground',
                week: 'mt-2 flex w-full',
                day: 'relative size-9 p-0 text-center text-sm',
                day_button: cn(buttonVariants({ variant: 'ghost' }), 'size-9 rounded-md p-0 font-normal'),
                selected:
                    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
                today: 'rounded-md bg-accent text-accent-foreground',
                outside: 'text-muted-foreground opacity-50',
                disabled: 'text-muted-foreground opacity-50',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

export { Calendar };
