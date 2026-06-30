<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Labeled "detail" cards under a pelayanan (e.g. KONSELOR / JADWAL /
        // LOKASI) — a bold label plus a value, drag-sortable within the parent.
        Schema::create('pelayanan_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pelayanan_id')->constrained('pelayanan')->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_details');
    }
};
