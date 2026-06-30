<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Big" ministry cards shown on the public Pelayanan page. Each has a
        // title/subtitle, a body description, a 4:3 image, and a manually
        // drag-sortable order. Labeled detail cards live in pelayanan_details.
        Schema::create('pelayanan', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle');
            $table->text('description');
            $table->string('image_public_id');
            $table->string('image_url');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan');
    }
};
