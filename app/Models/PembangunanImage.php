<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PembangunanImage extends Model
{
    protected $fillable = [
        'public_id',
        'url',
        'order',
    ];
}
