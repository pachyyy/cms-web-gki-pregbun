<?php

use App\Http\Controllers\KebaktianController;
use App\Http\Controllers\PembangunanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('user', function () {
        return Inertia::render('user');
    })->name('user');

    Route::get('kepemimpinan', function () {
        return Inertia::render('kepemimpinan');
    })->name('kepemimpinan');

    Route::get('kebaktian', [KebaktianController::class, 'index'])->name('kebaktian');
    Route::put('kebaktian/{kebaktian}', [KebaktianController::class, 'update'])->name('kebaktian.update');
    Route::post('kebaktian/{kebaktian}/images', [KebaktianController::class, 'storeImage'])->name('kebaktian.images.store');
    Route::put('kebaktian/{kebaktian}/images/reorder', [KebaktianController::class, 'reorderImages'])->name('kebaktian.images.reorder');
    Route::delete('kebaktian/images/{image}', [KebaktianController::class, 'destroyImage'])->name('kebaktian.images.destroy');

    Route::get('event', function () {
        return Inertia::render('event');
    })->name('event');

    Route::get('pelayanan', function () {
        return Inertia::render('pelayanan');
    })->name('pelayanan');

    Route::get('komisi', function () {
        return Inertia::render('komisi');
    })->name('komisi');

    Route::get('dummy', function () {
        return Inertia::render('dummy');
    })->name('dummy');

    Route::get('pembangunan', [PembangunanController::class, 'index'])->name('pembangunan');
    Route::post('pembangunan', [PembangunanController::class, 'store'])->name('pembangunan.store');
    Route::delete('pembangunan/{pembangunanUpdate}', [PembangunanController::class, 'destroy'])->name('pembangunan.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
