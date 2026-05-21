<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('kepemimpinan', function () {
        return Inertia::render('kepemimpinan');
    })->name('kepemimpinan');
    Route::get('event', function () {
        return Inertia::render('event');
    })->name('event');
    Route::get('pelayanan', function () {
        return Inertia::render('pelayanan');
    })->name('pelayanan');
    Route::get('komisi', function () {
        return Inertia::render('komisi');
    })->name('komisi');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
