<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PelayananDetail extends Model
{
    protected $fillable = [
        'pelayanan_id',
        'label',
        'value',
        'order',
    ];

    public function pelayanan(): BelongsTo
    {
        return $this->belongsTo(Pelayanan::class);
    }
}
