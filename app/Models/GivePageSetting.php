<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GivePageSetting extends Model
{
    protected $fillable = [
        'hero_image_public_id',
        'hero_image_url',
    ];

    /**
     * There is only ever one settings row. Fetch it, creating it on first
     * use, instead of every caller needing to know that detail.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }
}