<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    private const MONTHS = [
        'januari' => 1, 'februari' => 2, 'maret' => 3, 'april' => 4,
        'mei' => 5, 'juni' => 6, 'juli' => 7, 'agustus' => 8,
        'september' => 9, 'oktober' => 10, 'november' => 11, 'desember' => 12,
    ];

    /**
     * Expand phase of an expand/contract migration.
     *
     * Adds the structured columns as NULLABLE, backfills every existing row
     * from the free-text `schedule` / `time` pair, then relaxes `schedule` and
     * `time` to nullable so the old code (which writes them) and the new code
     * (which does not) can both run against this schema. Nothing is dropped and
     * no NOT NULL constraint is tightened here — that is migration
     * ..._100003_drop_legacy_schedule_columns_from_events_table.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'type')) {
                $table->string('type')->nullable()->index()->after('title');
            }
            if (! Schema::hasColumn('events', 'event_date')) {
                $table->date('event_date')->nullable()->after('type');
            }
            if (! Schema::hasColumn('events', 'start_time')) {
                $table->time('start_time')->nullable()->after('day');
            }
            if (! Schema::hasColumn('events', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
        });

        $this->backfill();

        // Separate statement: a column cannot be added and changed in one Blueprint.
        Schema::table('events', function (Blueprint $table) {
            $table->string('schedule')->nullable()->change();
            $table->string('time')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('schedule')->nullable(false)->change();
            $table->string('time')->nullable(false)->change();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['type', 'event_date', 'start_time', 'end_time']);
        });
    }

    /**
     * Idempotent: only touches rows whose `type` is still NULL, so it can be
     * re-run (the contract migration calls the same logic for stragglers
     * written by old code between the two deploys).
     */
    private function backfill(): void
    {
        if (! Schema::hasColumn('events', 'schedule')) {
            return; // fresh install already past the contract migration
        }

        foreach (DB::table('events')->whereNull('type')->orderBy('id')->get() as $row) {
            $schedule = trim((string) ($row->schedule ?? ''));
            $isMingguan = str_starts_with(mb_strtolower($schedule), 'setiap');

            [$start, $end] = $this->splitTimeRange((string) ($row->time ?? ''));

            DB::table('events')->where('id', $row->id)->update([
                'type' => $isMingguan ? 'mingguan' : 'spesial',
                'day' => $isMingguan ? ($row->day ?: $this->findDay($schedule) ?? 'Minggu') : null,
                'event_date' => $isMingguan ? null : $this->parseIndonesianDate($schedule),
                // `start_time` becomes NOT NULL in the contract migration; a row
                // with unparseable time gets midnight rather than blocking it.
                'start_time' => $start ?? '00:00:00',
                'end_time' => $end,
            ]);
        }
    }

    /** "10:00-11:30" => ['10:00:00', '11:30:00'];  "08:30" => ['08:30:00', null] */
    private function splitTimeRange(string $raw): array
    {
        $parts = preg_split('/\s*(?:-|–|—|s\/d|sd|sampai)\s*/iu', trim($raw), 2);

        return [
            $this->normalizeTime($parts[0] ?? ''),
            isset($parts[1]) ? $this->normalizeTime($parts[1]) : null,
        ];
    }

    /** Accepts "07:30", "07.30", "7:30" — the legacy column allowed all three. */
    private function normalizeTime(string $raw): ?string
    {
        if (! preg_match('/(\d{1,2})[.:](\d{2})/', $raw, $m)) {
            return null;
        }

        return sprintf('%02d:%02d:00', min((int) $m[1], 23), min((int) $m[2], 59));
    }

    private function findDay(string $schedule): ?string
    {
        foreach (self::DAYS as $day) {
            if (str_contains($schedule, $day)) {
                return $day;
            }
        }

        return null;
    }

    /**
     * "17 Agustus 2026" => "2026-08-17". A full month map rather than hardcoding
     * the single spesial row that exists today, because another developer can
     * add a spesial event on the shared DB before this migration runs.
     * A range like "1 - 31 Agustus 2026" collapses to its first day.
     */
    private function parseIndonesianDate(string $schedule): ?string
    {
        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $schedule, $iso)) {
            return $iso[0];
        }

        if (! preg_match('/(\d{1,2})\s*(?:[-–—]\s*\d{1,2}\s*)?([A-Za-z]+)\s*(\d{4})/u', $schedule, $m)) {
            return null;
        }

        $prefix = mb_strtolower(mb_substr($m[2], 0, 3));

        foreach (self::MONTHS as $name => $number) {
            if (str_starts_with($name, $prefix)) {
                return sprintf('%04d-%02d-%02d', (int) $m[3], $number, (int) $m[1]);
            }
        }

        return null;
    }
};
