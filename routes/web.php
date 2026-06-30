<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\KebaktianController;
use App\Http\Controllers\PersembahanController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\WartaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing page renders the login screen (welcome page is no longer used).
Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('home');

Route::middleware(['auth'])->group(function () {

    // Dashboard (Warta Jemaat)
    Route::get('dashboard', [WartaController::class, 'index'])->name('dashboard');
    Route::post('warta', [WartaController::class, 'store'])->name('warta.store');
    Route::put('warta/{warta}', [WartaController::class, 'update'])->name('warta.update');
    Route::delete('warta/{warta}', [WartaController::class, 'destroy'])->name('warta.destroy');

    // Kebaktian Page
    Route::get('kebaktian', [KebaktianController::class, 'index'])->name('kebaktian');
    Route::put('kebaktian/{kebaktian}', [KebaktianController::class, 'update'])->name('kebaktian.update');
    Route::post('kebaktian/{kebaktian}/images', [KebaktianController::class, 'storeImage'])->name('kebaktian.images.store');
    Route::put('kebaktian/{kebaktian}/images/reorder', [KebaktianController::class, 'reorderImages'])->name('kebaktian.images.reorder');
    Route::delete('kebaktian/images/{image}', [KebaktianController::class, 'destroyImage'])->name('kebaktian.images.destroy');
    Route::put('kebaktian/{kebaktian}/home', [KebaktianController::class, 'updateHome'])->name('kebaktian.home.update');
    Route::post('kebaktian/{kebaktian}/home-image', [KebaktianController::class, 'storeHomeImage'])->name('kebaktian.home-image.store');
    Route::delete('kebaktian/{kebaktian}/home-image', [KebaktianController::class, 'destroyHomeImage'])->name('kebaktian.home-image.destroy');

    Route::get('event', function () {
        return Inertia::render('event');
    })->name('event');

    Route::get('komisi', function () {
        return Inertia::render('komisi');
    })->name('komisi');

    Route::get('persembahan', function () {
        return Inertia::render('persembahan');
    })->name('persembahan');

    Route::get('dummy', function () {
        return Inertia::render('dummy');
    })->name('dummy');

    Route::get('persembahan', [PersembahanController::class, 'index'])->name('persembahan');
    Route::post('persembahan', [PersembahanController::class, 'store'])->name('persembahan.store');
    Route::put('persembahan/{persembahan}', [PersembahanController::class, 'update'])->name('persembahan.update');
    Route::delete('persembahan/{persembahan}', [PersembahanController::class, 'destroy'])->name('persembahan.destroy');
    Route::put('persembahan-reorder', [PersembahanController::class, 'reorder'])->name('persembahan.reorder');

    Route::post('persembahan/{persembahan}/qr-image', [PersembahanController::class, 'storeQrImage'])
        ->name('persembahan.qr-image.store');
    Route::delete('persembahan/{persembahan}/qr-image', [PersembahanController::class, 'destroyQrImage'])
        ->name('persembahan.qr-image.destroy');

    Route::post('persembahan-hero-image', [PersembahanController::class, 'storeHeroImage'])
        ->name('persembahan.hero-image.store');
    Route::delete('persembahan-hero-image', [PersembahanController::class, 'destroyHeroImage'])
        ->name('persembahan.hero-image.destroy');

    Route::get('event', [EventController::class, 'index'])->name('event');
    Route::post('event', [EventController::class, 'store'])->name('event.store');
    Route::put('event/{event}', [EventController::class, 'update'])->name('event.update');
    Route::delete('event/{event}', [EventController::class, 'destroy'])->name('event.destroy');

    Route::post('event/{event}/image', [EventController::class, 'storeImage'])->name('event.image.store');
    Route::delete('event/{event}/image', [EventController::class, 'destroyImage'])->name('event.image.destroy');

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/tentang-kami.php';
require __DIR__.'/pembangunan.php';
require __DIR__.'/pelayanan.php';
require __DIR__.'/user.php';
