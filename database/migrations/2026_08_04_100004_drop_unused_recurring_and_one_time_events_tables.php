<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `recurring_events` and `one_time_events` were the first design for
     * scheduled events, superseded a day later by the `events` table (see
     * 2026_06_28_000001_create_recurring_events_table and the `events` create
     * migration). Neither table is referenced anywhere in the app —
     * App\Models\RecurringEvent / OneTimeEvent and their FormRequests are dead
     * code, removed alongside this migration. Verified before writing:
     * `recurring_events` held a single throwaway test row, `one_time_events`
     * was empty.
     */
    public function up(): void
    {
        Schema::dropIfExists('one_time_events');
        Schema::dropIfExists('recurring_events');
    }

    public function down(): void
    {
        Schema::create('recurring_events', function (Blueprint $table) {
            $table->id();
            $table->string('day');
            $table->string('title');
            $table->time('time');
            $table->string('location');
            $table->text('description');
            $table->timestamps();
        });

        Schema::create('one_time_events', function (Blueprint $table) {
            $table->id();
            $table->date('event_date');
            $table->string('title');
            $table->string('time_label');
            $table->string('location');
            $table->text('description');
            $table->boolean('has_signup')->default(false);
            $table->timestamps();
        });
    }
};
