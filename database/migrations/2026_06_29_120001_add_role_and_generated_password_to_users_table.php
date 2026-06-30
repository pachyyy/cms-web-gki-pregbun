<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('password');
            // Encrypted-at-rest copy of the admin-issued password so it can be
            // re-shown/sent. Text (not varchar) because ciphertext is long.
            $table->text('generated_password')->nullable()->after('role');
        });

        // Every account that already exists keeps full access.
        DB::table('users')->update(['role' => 'admin']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'generated_password']);
        });
    }
};
