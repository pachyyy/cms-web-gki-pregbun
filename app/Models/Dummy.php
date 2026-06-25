<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dummy extends Model
{
    protected $table = 'dummy';

    protected $fillable = [
        'title',
        'content',
        'thumbnail_url'
    ];
}
