<?php

use App\Http\Controllers\HambaTuhanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('tentangkami', [HambaTuhanController::class, 'index'])->name('tentangkami');

    // Hamba Tuhan (servants) on the Tentang Kami page.
    Route::post('hamba-tuhan', [HambaTuhanController::class, 'store'])->name('hamba-tuhan.store');
    Route::put('hamba-tuhan/reorder', [HambaTuhanController::class, 'reorder'])->name('hamba-tuhan.reorder');
    Route::put('hamba-tuhan/{hambaTuhan}', [HambaTuhanController::class, 'update'])->name('hamba-tuhan.update');
    Route::post('hamba-tuhan/{hambaTuhan}/image', [HambaTuhanController::class, 'updateImage'])->name('hamba-tuhan.image.update');
    Route::delete('hamba-tuhan/{hambaTuhan}', [HambaTuhanController::class, 'destroy'])->name('hamba-tuhan.destroy');
});
