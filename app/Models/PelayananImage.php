<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PelayananImage extends Model
{
    protected $fillable = [
        'pelayanan_id',
        'public_id',
        'url',
        'order',
    ];

    public function pelayanan(): BelongsTo
    {
        return $this->belongsTo(Pelayanan::class);
    }
}
