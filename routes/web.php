<?php

use App\Http\Controllers\MovieController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All application routes registered following Laravel conventions.
|
*/

// Main page — returns Blade view or JSON movie list for AJAX requests
Route::get('/', [MovieController::class, 'index'])->name('movies.index');

// Movie CRUD routes
Route::post('/movies', [MovieController::class, 'store'])->name('movies.store');
Route::get('/movies/{id}', [MovieController::class, 'show'])->name('movies.show');
Route::put('/movies/{id}', [MovieController::class, 'update'])->name('movies.update');
Route::delete('/movies/{id}', [MovieController::class, 'destroy'])->name('movies.destroy');
