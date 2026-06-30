<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Admin-only account management. Non-admins are redirected to the dashboard.
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('user', [UserController::class, 'index'])->name('user');
    Route::get('user/create', [UserController::class, 'create'])->name('user.create');
    Route::post('user', [UserController::class, 'store'])->name('user.store');
    Route::post('user/{user}/regenerate-password', [UserController::class, 'regeneratePassword'])->name('user.regenerate');
    Route::delete('user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
});
