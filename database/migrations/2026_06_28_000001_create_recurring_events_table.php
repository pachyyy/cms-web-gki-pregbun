<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_events', function (Blueprint $table) {
            $table->id();
            // Indonesian day name, matches the fixed dayOrder list in the
            // frontend (Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu).
            // Kept as a plain string rather than an enum so the frontend's
            // existing day-name strings can be inserted directly.
            $table->string('day');
            $table->string('title');
            // Stored as a real time so "sort by time" is a correct
            // chronological sort, not a string sort (which would put
            // "09.00" after "19.00" incorrectly).
            $table->time('time');
            $table->string('location');
            $table->text('description');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_events');
    }
};