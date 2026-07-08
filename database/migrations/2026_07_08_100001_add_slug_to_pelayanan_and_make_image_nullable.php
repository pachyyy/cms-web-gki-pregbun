<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pelayanan became a fixed set of tabs (identified by slug) instead of a
        // freely add/deletable list, mirroring the kebaktian pattern. The image
        // is now optional so a seeded tab can exist before a photo is uploaded.
        Schema::table('pelayanan', function (Blueprint $table) {
            if (! Schema::hasColumn('pelayanan', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('id');
            }

            $table->string('image_public_id')->nullable()->change();
            $table->string('image_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pelayanan', function (Blueprint $table) {
            if (Schema::hasColumn('pelayanan', 'slug')) {
                $table->dropUnique(['slug']);
                $table->dropColumn('slug');
            }

            $table->string('image_public_id')->nullable(false)->change();
            $table->string('image_url')->nullable(false)->change();
        });
    }
};
