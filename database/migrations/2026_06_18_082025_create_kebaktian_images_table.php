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
        Schema::create('kebaktian_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kebaktian_id')->constrained()->cascadeOnDelete();
            $table->string('public_id');
            $table->string('url');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kebaktian_images');
    }
};
