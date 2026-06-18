<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kebaktian extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'description',
        'schedules',
        'location',
        'audience',
        'youtube_url',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'schedules' => 'array',
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(KebaktianImage::class)->orderBy('order');
    }
}
