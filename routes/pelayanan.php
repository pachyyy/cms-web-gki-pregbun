<?php

use App\Http\Controllers\PelayananController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('pelayanan', [PelayananController::class, 'index'])->name('pelayanan');
    Route::post('pelayanan', [PelayananController::class, 'store'])->name('pelayanan.store');

    // Outer drag order of the big pelayanan cards.
    Route::put('pelayanan-reorder', [PelayananController::class, 'reorder'])->name('pelayanan.reorder');

    Route::put('pelayanan/{pelayanan}', [PelayananController::class, 'update'])->name('pelayanan.update');
    Route::post('pelayanan/{pelayanan}/image', [PelayananController::class, 'updateImage'])->name('pelayanan.image.update');
    Route::delete('pelayanan/{pelayanan}', [PelayananController::class, 'destroy'])->name('pelayanan.destroy');

    // Inner labeled detail cards, saved as one synced set.
    Route::put('pelayanan/{pelayanan}/details', [PelayananController::class, 'syncDetails'])->name('pelayanan.details.sync');
});
