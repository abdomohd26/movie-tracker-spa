<?php

use App\Http\Controllers\OmdbController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| OMDb third-party API integration routes.
| These are prefixed with /api automatically by Laravel.
|
*/

Route::get('/omdb/search', [OmdbController::class, 'search']);
Route::get('/omdb/details', [OmdbController::class, 'details']);
