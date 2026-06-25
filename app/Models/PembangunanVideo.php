<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PembangunanVideo extends Model
{
    protected $fillable = [
        'youtube_url',
        'youtube_embed_url',
    ];
}
