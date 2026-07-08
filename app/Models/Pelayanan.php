<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pelayanan extends Model
{
    protected $table = 'pelayanan';

    protected $fillable = [
        'slug',
        'title',
        'subtitle',
        'description',
        'order',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(PelayananDetail::class)->orderBy('order');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PelayananImage::class)->orderBy('order');
    }
}
