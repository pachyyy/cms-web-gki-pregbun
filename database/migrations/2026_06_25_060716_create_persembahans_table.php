<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persembahans', function (Blueprint $table) {
            $table->id();
            // Stable, human-chosen slug used in the frontend (e.g. "umum", "beasiswa").
            // Kept separate from the auto-increment id so URLs / keys don't shift
            // if rows are re-seeded.
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('entity');
            $table->string('bank');
            $table->string('rekening');
            $table->string('display_rekening');
            $table->string('qr_public_id')->nullable();
            $table->string('qr_url')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('persembahans');
    }
};