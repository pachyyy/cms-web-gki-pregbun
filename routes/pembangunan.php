<?php

use App\Http\Controllers\PembangunanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    // Dana Pembangunan tab: financial snapshots
    Route::get('pembangunan', [PembangunanController::class, 'index'])->name('pembangunan');
    Route::post('pembangunan', [PembangunanController::class, 'store'])->name('pembangunan.store');
    Route::delete('pembangunan/{pembangunanUpdate}', [PembangunanController::class, 'destroy'])->name('pembangunan.destroy');

    // Update tab: YouTube video history + image gallery
    Route::post('pembangunan/video', [PembangunanController::class, 'storeVideo'])->name('pembangunan.video.store');
    Route::delete('pembangunan/video/{video}', [PembangunanController::class, 'destroyVideo'])->name('pembangunan.video.destroy');
    Route::post('pembangunan/image', [PembangunanController::class, 'storeImage'])->name('pembangunan.image.store');
    Route::put('pembangunan/image/reorder', [PembangunanController::class, 'reorderImages'])->name('pembangunan.images.reorder');
    Route::delete('pembangunan/image/{image}', [PembangunanController::class, 'destroyImage'])->name('pembangunan.image.destroy');
});
