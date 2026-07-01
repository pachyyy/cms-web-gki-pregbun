<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Singleton (always one row) holding the public home page's hero videos:
        // one 16:9 and one 4:3, uploaded to Cloudinary.
        Schema::create('home_settings', function (Blueprint $table) {
            $table->id();
            $table->string('video_16x9_public_id')->nullable();
            $table->string('video_16x9_url')->nullable();
            $table->string('video_4x3_public_id')->nullable();
            $table->string('video_4x3_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_settings');
    }
};
