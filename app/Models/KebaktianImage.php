<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KebaktianImage extends Model
{
    protected $fillable = [
        'kebaktian_id',
        'public_id',
        'url',
        'order',
    ];

    public function kebaktian(): BelongsTo
    {
        return $this->belongsTo(Kebaktian::class);
    }
}
