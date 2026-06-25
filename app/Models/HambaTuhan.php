<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HambaTuhan extends Model
{
    protected $table = 'hamba_tuhan';

    protected $fillable = [
        'name',
        'description',
        'image_public_id',
        'image_url',
        'order',
    ];
}
