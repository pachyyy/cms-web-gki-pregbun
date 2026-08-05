<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `2026_06_29_000001_create_events_table` created the table as `event`
     * (singular) while `2026_07_26_042413_add_day_to_event_table` and
     * App\Models\Event both target `events` (plural). On the shared Supabase DB
     * that left an empty orphan `event` table alongside the live `events` one,
     * and it made `migrate:fresh` fail outright. The create migration is fixed
     * to say `events`; this drops the orphan it left behind.
     *
     * Verified empty (0 rows) before writing this migration. dropIfExists so it
     * is a no-op on any environment created after the create-migration fix.
     */
    public function up(): void
    {
        Schema::dropIfExists('event');
    }

    /**
     * Intentionally empty: recreating an empty orphan table serves no purpose
     * and would re-break `migrate:fresh`.
     */
    public function down(): void
    {
        //
    }
};
