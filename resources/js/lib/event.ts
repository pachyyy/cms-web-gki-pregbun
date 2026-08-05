import { format, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

export type EventType = 'mingguan' | 'spesial';

export interface EventItem {
    id: number;
    title: string;
    type: EventType;
    /** `yyyy-MM-dd` — set iff type === 'spesial'. */
    event_date: string | null;
    /** One of DAYS — set iff type === 'mingguan'. */
    day: string | null;
    /** `HH:mm`. */
    start_time: string;
    /** `HH:mm`, or null when the event has no explicit end. */
    end_time: string | null;
    location: string;
    description: string;
    details: string | null;
    contact: string | null;
    category: string;
    image_public_id: string | null;
    image_url: string | null;
}

/**
 * The human-readable schedule line. Previously stored verbatim in the dropped
 * `schedule` column; now derived, so the public site must apply the same rule.
 */
export function formatEventSchedule(item: Pick<EventItem, 'type' | 'day' | 'event_date'>): string {
    if (item.type === 'mingguan') {
        return item.day ? `Setiap ${item.day}` : 'Hari belum diatur';
    }

    if (!item.event_date) return 'Tanggal belum diatur';

    return format(parse(item.event_date, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', { locale: localeId });
}

/** '10:00–11:30' when a range exists, otherwise '08:30'. */
export function formatEventTime(item: Pick<EventItem, 'start_time' | 'end_time'>): string {
    return item.end_time ? `${item.start_time}–${item.end_time}` : item.start_time;
}
