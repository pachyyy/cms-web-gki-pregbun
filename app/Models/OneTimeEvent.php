<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OneTimeEvent extends Model
{
    protected $fillable = [
        'event_date',
        'title',
        'time_label',
        'location',
        'description',
        'has_signup',
    ];

    protected $casts = [
        'event_date' => 'date',
        'has_signup' => 'boolean',
    ];
}