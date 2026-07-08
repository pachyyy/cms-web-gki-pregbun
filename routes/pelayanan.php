<?php

use App\Http\Controllers\PelayananController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('pelayanan', [PelayananController::class, 'index'])->name('pelayanan');

    // Fixed set of ministries — content-only edits (no add/delete/reorder of tabs).
    Route::put('pelayanan/{pelayanan}', [PelayananController::class, 'update'])->name('pelayanan.update');

    // Up to 5 gallery images per pelayanan, drag-reorderable.
    Route::post('pelayanan/{pelayanan}/images', [PelayananController::class, 'storeImage'])->name('pelayanan.images.store');
    Route::put('pelayanan/{pelayanan}/images/reorder', [PelayananController::class, 'reorderImages'])->name('pelayanan.images.reorder');
    Route::delete('pelayanan/images/{image}', [PelayananController::class, 'destroyImage'])->name('pelayanan.images.destroy');

    // Inner labeled detail cards, saved as one synced set.
    Route::put('pelayanan/{pelayanan}/details', [PelayananController::class, 'syncDetails'])->name('pelayanan.details.sync');
});
