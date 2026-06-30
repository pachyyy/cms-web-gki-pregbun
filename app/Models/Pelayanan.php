<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pelayanan extends Model
{
    protected $table = 'pelayanan';

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'image_public_id',
        'image_url',
        'order',
    ];

    public function details(): HasMany
    {
        return $this->hasMany(PelayananDetail::class)->orderBy('order');
    }
}
