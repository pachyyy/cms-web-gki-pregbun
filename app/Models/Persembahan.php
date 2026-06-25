<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Persembahan extends Model
{
        protected $fillable = [
        'persembahan_id',
        'title',
        'entity',
        'bank',
        'rekening',
        'displayRekening',
        'qr_url',
        'order',
    ];

    public function persembahan(): BelongsTo
    {
        return $this->belongsTo(Persembahan::class);
    }
}
