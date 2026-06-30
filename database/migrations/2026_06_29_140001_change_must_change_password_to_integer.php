<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Laravel binds PHP booleans as integers, which the native pgsql driver
     * refuses to insert into a real boolean column ("type boolean but expression
     * is of type integer"). Store as a small integer (0/1) instead; the model's
     * 'boolean' cast still exposes it as a true/false in PHP and JSON.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('must_change_password');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('must_change_password')->default(0)->after('generated_password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('must_change_password');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->after('generated_password');
        });
    }
};
