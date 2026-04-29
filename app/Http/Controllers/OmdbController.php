<?php

namespace App\Http\Controllers;

use App\Services\OmdbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OmdbController extends Controller
{
    /**
     * Controller-based API calls to the OMDb third-party API.
     * All OMDb requests are proxied through this controller.
     */
    public function __construct(
        private readonly OmdbService $omdb
    ) {}

    /*
    |--------------------------------------------------------------------------
    | Search — Search movies on OMDb
    |--------------------------------------------------------------------------
    */

    /**
     * Search OMDb for movies by title.
     * Handles API failures gracefully with user-friendly error messages.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('query', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'success' => false,
                'status'  => 400,
                'message' => 'Search query must be at least 2 characters',
                'data'    => null,
            ], 400);
        }

        try {
            $movies = $this->omdb->search($query);

            return response()->json([
                'success' => true,
                'status'  => 200,
                'message' => 'Movies fetched from OMDb',
                'data'    => $movies,
                'movies'  => $movies,
            ]);
        } catch (\Throwable $e) {
            // Handle API failures gracefully — display user-friendly message
            return response()->json([
                'success' => false,
                'status'  => 502,
                'message' => $e->getMessage() ?: 'OMDb API is currently unavailable. Please try again later.',
                'data'    => null,
            ], 502);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Details — Get movie details from OMDb
    |--------------------------------------------------------------------------
    */

    /**
     * Get detailed movie information from OMDb by IMDb ID.
     * Handles API failures gracefully with user-friendly error messages.
     */
    public function details(Request $request): JsonResponse
    {
        $imdbId = trim((string) ($request->input('imdb_id') ?? $request->input('movie_id') ?? ''));

        if (! preg_match('/^tt\d{5,10}$/', $imdbId)) {
            return response()->json([
                'success' => false,
                'status'  => 400,
                'message' => 'A valid IMDb ID is required',
                'data'    => null,
            ], 400);
        }

        try {
            $movie = $this->omdb->getDetails($imdbId);

            return response()->json([
                'success' => true,
                'status'  => 200,
                'message' => 'Movie details fetched from OMDb',
                'data'    => $movie,
                'movie'   => $movie,
            ]);
        } catch (\Throwable $e) {
            // Handle API failures gracefully — display user-friendly message
            return response()->json([
                'success' => false,
                'status'  => 502,
                'message' => $e->getMessage() ?: 'OMDb API is currently unavailable. Please try again later.',
                'data'    => null,
            ], 502);
        }
    }
}
