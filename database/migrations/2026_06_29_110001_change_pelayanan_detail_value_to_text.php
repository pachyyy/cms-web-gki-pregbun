<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Detail card values can hold multi-line text, so widen from the default
        // varchar(255) to text.
        Schema::table('pelayanan_details', function (Blueprint $table) {
            $table->text('value')->change();
        });
    }

    public function down(): void
    {
        Schema::table('pelayanan_details', function (Blueprint $table) {
            $table->string('value')->change();
        });
    }
};
