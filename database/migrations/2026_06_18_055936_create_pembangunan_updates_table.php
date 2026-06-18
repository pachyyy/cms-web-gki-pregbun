<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pembangunan_updates', function (Blueprint $table) {
            $table->id();
            $table->date('update_date');
            $table->unsignedBigInteger('target_persembahan');
            $table->unsignedBigInteger('persembahan_pembangunan');
            $table->unsignedBigInteger('janji_iman_terealisasi');
            $table->unsignedBigInteger('janji_iman_belum_terealisasi');
            $table->date('rincian_start_date');
            $table->date('rincian_end_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembangunan_updates');
    }
};
