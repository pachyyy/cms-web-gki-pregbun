<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `2026_06_25_060716_create_persembahans_table` originally created `slug`
     * as UNIQUE NOT NULL, then was edited in place (same class of bug as the
     * event/events one — an already-applied migration rewritten instead of
     * appended to) to drop the unique index and make it nullable. That edit is
     * a no-op on the shared Supabase DB, where the drop already ran under the
     * old filename; this is the equivalent logic split into its own migration
     * so a fresh install reaches the same end state. Guarded so it is also a
     * safe no-op on the shared DB, where that end state already exists.
     */
    public function up(): void
    {
        $hasUniqueIndex = collect(Schema::getIndexes('persembahans'))
            ->contains(fn ($index) => $index['name'] === 'persembahans_slug_unique');

        if ($hasUniqueIndex) {
            Schema::table('persembahans', function (Blueprint $table) {
                $table->dropUnique('persembahans_slug_unique');
            });
        }

        $slugColumn = collect(Schema::getColumns('persembahans'))->firstWhere('name', 'slug');

        if ($slugColumn && ! $slugColumn['nullable']) {
            Schema::table('persembahans', function (Blueprint $table) {
                $table->string('slug')->nullable()->change();
            });
        }
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
