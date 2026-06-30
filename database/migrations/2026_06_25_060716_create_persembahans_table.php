<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('persembahans', function (Blueprint $table) {
            $table->dropUnique('persembahans_slug_unique');
        });

        Schema::table('persembahans', function (Blueprint $table) {
            $table->string('slug')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('persembahans', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });

        Schema::table('persembahans', function (Blueprint $table) {
            $table->unique('slug');
        });
    }
};