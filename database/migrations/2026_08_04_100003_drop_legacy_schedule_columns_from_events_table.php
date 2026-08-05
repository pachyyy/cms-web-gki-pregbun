<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const MONTHS = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    /**
     * Contract phase. THIS IS THE BREAKING STEP for the separate public-facing
     * site — it must already read `type` / `event_date` / `day` / `start_time` /
     * `end_time` before this runs. Do not run it until the CMS deploy is live
     * and the verification queries in the PR description return all zeros.
     */
    public function up(): void
    {
        // Safety net for rows inserted by the pre-deploy code between migration
        // ..._100002 and this one. Expected to affect 0 rows.
        DB::table('events')->whereNull('type')->update(['type' => 'mingguan']);
        DB::table('events')->whereNull('start_time')->update(['start_time' => '00:00:00']);
        DB::table('events')->where('type', 'mingguan')->whereNull('day')->update(['day' => 'Minggu']);

        Schema::table('events', function (Blueprint $table) {
            $table->string('type')->nullable(false)->change();
            $table->time('start_time')->nullable(false)->change();
        });

        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'schedule')) {
                $table->dropColumn('schedule');
            }
            if (Schema::hasColumn('events', 'time')) {
                $table->dropColumn('time');
            }
        });
    }

    /**
     * Rebuilds the legacy free-text columns from the structured ones so a
     * rollback leaves the public site readable rather than blank.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('schedule')->nullable();
            $table->string('time')->nullable();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->string('type')->nullable()->change();
            $table->time('start_time')->nullable()->change();
        });

        foreach (DB::table('events')->orderBy('id')->get() as $row) {
            $date = $row->event_date ? substr((string) $row->event_date, 0, 10) : null;

            DB::table('events')->where('id', $row->id)->update([
                'schedule' => $row->type === 'mingguan'
                    ? 'Setiap '.$row->day
                    : ($date ? (int) substr($date, 8, 2).' '.self::MONTHS[(int) substr($date, 5, 2)].' '.substr($date, 0, 4) : ''),
                'time' => $row->end_time
                    ? substr((string) $row->start_time, 0, 5).'-'.substr((string) $row->end_time, 0, 5)
                    : substr((string) $row->start_time, 0, 5),
            ]);
        }

        Schema::table('events', function (Blueprint $table) {
            $table->string('schedule')->nullable(false)->change();
            $table->string('time')->nullable(false)->change();
        });
    }
};
