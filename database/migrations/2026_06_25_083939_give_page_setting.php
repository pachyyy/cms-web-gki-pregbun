<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Singleton table (always exactly one row) holding page-level settings
        // for the public Give/Persembahan page — currently just the hero
        // background image. Mirrors the home_image_* pattern used on
        // kebaktians, but lives on its own table since the hero belongs to
        // the page, not to any single giving item.
        Schema::create('give_page_settings', function (Blueprint $table) {
            $table->id();
            $table->string('hero_image_public_id')->nullable();
            $table->string('hero_image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('give_page_settings');
    }
};