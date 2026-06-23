<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warta extends Model
{
    protected $table = 'warta';

    protected $fillable = [
        'service_date',
        'title',
        'source_url',
        'url',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
        ];
    }
}
