<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    public const TYPE_MINGGUAN = 'mingguan';

    public const TYPE_SPESIAL = 'spesial';

    /** Must stay in sync with DAYS in resources/js/lib/event.ts. */
    public const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    protected $fillable = [
        'title',
        'type',
        'event_date',
        'day',
        'start_time',
        'end_time',
        'location',
        'description',
        'details',
        'contact',
        'category',
        'image_public_id',
        'image_url',
    ];

    protected $casts = [
        // 'date:Y-m-d', not plain 'date'. A plain 'date' cast serializes to
        // "2026-08-17T00:00:00.000000Z", which the frontend picker would have
        // to slice apart (and which can shift a day across timezones). This
        // emits exactly the "2026-08-17" wire format the picker reads/writes.
        'event_date' => 'date:Y-m-d',
    ];

    /**
     * Postgres returns a `time` column as "10:00:00"; SQLite returns whatever
     * string was written ("10:00"). Trimming to H:i on read makes the JSON
     * prop, the time picker, and the `date_format:H:i` validation rule agree
     * in both environments.
     *
     * Deliberately NOT a 'datetime' cast: Carbon would attach a meaningless
     * date and serialize a full ISO timestamp the frontend would have to
     * re-strip. Writes pass through untouched — Postgres casts "10:00" to
     * `time` itself.
     */
    protected function startTime(): Attribute
    {
        return Attribute::make(get: fn (?string $value) => $value === null ? null : substr($value, 0, 5));
    }

    protected function endTime(): Attribute
    {
        return Attribute::make(get: fn (?string $value) => $value === null ? null : substr($value, 0, 5));
    }

    /**
     * Mingguan first in week order (Senin → Minggu) then by clock; spesial
     * after, by date then clock. Indonesian day names do not sort
     * alphabetically into week order, hence the CASE. Spesial rows have
     * day IS NULL so they fall to rank 8 and sort by event_date instead;
     * mingguan rows have event_date IS NULL so that clause is inert for them.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderByRaw(
                "case day when 'Senin' then 1 when 'Selasa' then 2 when 'Rabu' then 3 ".
                "when 'Kamis' then 4 when 'Jumat' then 5 when 'Sabtu' then 6 ".
                "when 'Minggu' then 7 else 8 end"
            )
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->orderBy('id');
    }
}
