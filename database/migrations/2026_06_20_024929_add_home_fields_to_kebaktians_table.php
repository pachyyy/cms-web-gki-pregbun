<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kebaktians', function (Blueprint $table) {
            $table->string('home_image_public_id')->nullable()->after('youtube_url');
            $table->string('home_image_url')->nullable()->after('home_image_public_id');
            $table->string('home_subtitle')->nullable()->after('home_image_url');
        });

        // Backfill sensible defaults for the home cards on existing rows.
        $defaults = [
            'umum' => '07.30 · 10.00 · 17.00 WIB',
            'pemuda' => 'MINGGU 10.00 WIB',
            'remaja' => 'MINGGU 10.00 WIB',
            'sekolah-minggu' => 'MINGGU 10.00 WIB',
        ];

        foreach ($defaults as $slug => $subtitle) {
            DB::table('kebaktians')->where('slug', $slug)->update(['home_subtitle' => $subtitle]);
        }
    }

    public function down(): void
    {
        Schema::table('kebaktians', function (Blueprint $table) {
            $table->dropColumn(['home_image_public_id', 'home_image_url', 'home_subtitle']);
        });
    }
};
