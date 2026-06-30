<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecurringEvent extends Model
{
    protected $fillable = [
        'day',
        'title',
        'time',
        'location',
        'description',
    ];
}