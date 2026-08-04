<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Structured day-of-week for Rutin Mingguan events, e.g. "Senin".
            // Nullable because Event Spesial items use `schedule` (a date)
            // instead and have no single day-of-week. Will be consumed by
            // the public frontend later instead of parsing "Setiap X" out
            // of `schedule`.
            $table->string('day')->nullable()->after('schedule');
        });
    }
};