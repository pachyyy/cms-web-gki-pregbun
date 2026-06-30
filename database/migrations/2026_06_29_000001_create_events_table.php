<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            // Free-text, e.g. "Setiap Minggu", "Minggu & Selasa", "30 Maret 2026",
            // "1 – 31 Agustus 2026". Parsed client-side by nextOccurrence() /
            // getEventType() — kept as plain text rather than structured
            // fields, by design, to match the existing frontend logic.
            $table->string('schedule');
            // Also free text, e.g. "07.30", "12.00 / 19.00", "Sepanjang Hari".
            $table->string('time');
            $table->string('location');
            $table->text('description');
            $table->text('details')->nullable();
            $table->string('contact')->nullable();
            // Free-text category (no enum/dropdown enforcement per request),
            // but indexed since the public page filters by it.
            $table->string('category')->index();
            $table->string('image_public_id')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event');
    }
};