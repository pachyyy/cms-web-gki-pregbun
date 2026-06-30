<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Persembahan extends Model
{
    use HasFactory;

    /**
     * Hard cap on the number of giving items the public page supports.
     * Enforced here (rather than only in the controller) so any code path
     * that creates a Persembahan — controller, tinker, a future seeder —
     * is protected the same way.
     */
    public const MAX_ITEMS = 3;

    protected $fillable = [
        'slug',
        'title',
        'entity',
        'bank',
        'rekening',
        'display_rekening',
        'qr_public_id',
        'qr_url',
        'order',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Persembahan $persembahan) {
            if (static::query()->count() >= static::MAX_ITEMS) {
                throw new \RuntimeException(
                    'Maksimal '.static::MAX_ITEMS.' item persembahan. Hapus salah satu item sebelum menambah yang baru.'
                );
            }
        });
    }
}