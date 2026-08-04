<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title',
        'schedule',
        'day',
        'time',
        'location',
        'description',
        'details',
        'contact',
        'category',
        'image_public_id',
        'image_url',
    ];
}