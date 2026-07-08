<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pelayanan moves from a single image on the row to a gallery of up to
        // five reorderable images, mirroring kebaktian_images.
        if (! Schema::hasTable('pelayanan_images')) {
            Schema::create('pelayanan_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pelayanan_id')->constrained('pelayanan')->cascadeOnDelete();
                $table->string('public_id');
                $table->string('url');
                $table->unsignedInteger('order')->default(0);
                $table->timestamps();
            });
        }

        // Carry each existing single image over as the gallery's first image.
        if (Schema::hasColumn('pelayanan', 'image_public_id')) {
            $now = now();

            DB::table('pelayanan')
                ->whereNotNull('image_public_id')
                ->orderBy('id')
                ->get(['id', 'image_public_id', 'image_url'])
                ->each(function ($row) use ($now) {
                    DB::table('pelayanan_images')->insert([
                        'pelayanan_id' => $row->id,
                        'public_id' => $row->image_public_id,
                        'url' => $row->image_url,
                        'order' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                });

            Schema::table('pelayanan', function (Blueprint $table) {
                $table->dropColumn(['image_public_id', 'image_url']);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('pelayanan', 'image_public_id')) {
            Schema::table('pelayanan', function (Blueprint $table) {
                $table->string('image_public_id')->nullable();
                $table->string('image_url')->nullable();
            });
        }

        // Restore the first gallery image back onto the row.
        DB::table('pelayanan_images')
            ->where('order', 1)
            ->orderBy('id')
            ->get()
            ->each(function ($img) {
                DB::table('pelayanan')->where('id', $img->pelayanan_id)->update([
                    'image_public_id' => $img->public_id,
                    'image_url' => $img->url,
                ]);
            });

        Schema::dropIfExists('pelayanan_images');
    }
};
