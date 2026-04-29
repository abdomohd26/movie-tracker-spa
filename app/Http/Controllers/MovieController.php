<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MovieController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    */

    /**
     * Server-side validation rules using Laravel's built-in validation.
     */
    private function validationRules(bool $isUpdate = false): array
    {
        return [
            'title'            => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'genre'            => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:100',
            'release_year'     => ($isUpdate ? 'sometimes|' : '') . 'required|integer|min:1888|max:' . (date('Y') + 5),
            'duration_minutes' => ($isUpdate ? 'sometimes|' : '') . 'required|integer|min:1',
            'description'      => 'nullable|string',
            'director'         => 'nullable|string|max:255',
            'cast'             => 'nullable|string',
            'language'         => 'nullable|string|max:50',
            'country'          => 'nullable|string|max:100',
            'poster_path'      => 'nullable|string',
            'trailer_url'      => 'nullable|url',
            'rating'           => 'nullable|integer|min:1|max:10',
            'notes'            => 'nullable|string',
            'watched'          => 'nullable|boolean',
            'poster'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Index — Main Page / Movie List (JSON for AJAX)
    |--------------------------------------------------------------------------
    */

    /**
     * Show the main page or return a paginated JSON movie list.
     */
    public function index(Request $request)
    {
        // If the request wants JSON (AJAX fetch from JS), return movie data
        if ($request->ajax() || $request->wantsJson() || $request->has('page')) {
            return $this->movieListJson($request);
        }

        // Otherwise return the Blade view
        return view('movies.index');
    }

    /**
     * Return the paginated, filtered movie list as JSON.
     */
    private function movieListJson(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 5), 1), 50);
        $page    = max((int) $request->input('page', 1), 1);

        $query = Movie::query()
            ->filterByTitle($request->input('search'))
            ->filterByGenre($request->input('genre'))
            ->filterByWatched($request->input('watched'))
            ->orderByDesc('id');

        $totalItems = $query->count();
        $totalPages = max(1, (int) ceil($totalItems / $perPage));
        $page       = min($page, $totalPages);
        $offset     = ($page - 1) * $perPage;

        $movies = $query->skip($offset)->take($perPage)->get();

        // Collect unique genres for the filter dropdown
        $genres = Movie::whereNotNull('genre')
            ->where('genre', '<>', '')
            ->pluck('genre')
            ->flatMap(fn ($g) => array_map('trim', explode(',', $g)))
            ->filter()
            ->unique()
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json([
            'success'    => true,
            'status'     => 200,
            'message'    => 'Movies fetched',
            'data'       => $movies,
            'pagination' => [
                'page'        => $page,
                'per_page'    => $perPage,
                'total_items' => $totalItems,
                'total_pages' => $totalPages,
            ],
            'genres' => $genres,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Show — Single Movie (JSON)
    |--------------------------------------------------------------------------
    */

    /**
     * Return a single movie as JSON.
     */
    public function show(int $id): JsonResponse
    {
        $movie = Movie::find($id);

        if (! $movie) {
            return response()->json([
                'success' => false,
                'status'  => 404,
                'message' => 'Movie not found',
                'data'    => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'status'  => 200,
            'message' => 'Movie fetched',
            'data'    => $movie,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Store — Create Movie
    |--------------------------------------------------------------------------
    */

    /**
     * Validate and store a new movie.
     * Uses Laravel's built-in validation rules.
     */
    public function store(Request $request): JsonResponse
    {
        // Server-side validation using Laravel's validation
        $validated = $request->validate($this->validationRules());

        // Handle poster file upload
        $posterPath = $this->handlePosterUpload($request);
        if ($posterPath) {
            $validated['poster_path'] = $posterPath;
        }

        // Default watched to false if not provided
        $validated['watched'] = $request->boolean('watched');

        $movie = Movie::create($validated);

        return response()->json([
            'success' => true,
            'status'  => 201,
            'message' => 'Movie created',
            'data'    => $movie->fresh(),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Update — Edit Movie
    |--------------------------------------------------------------------------
    */

    /**
     * Validate and update an existing movie.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $movie = Movie::find($id);

        if (! $movie) {
            return response()->json([
                'success' => false,
                'status'  => 404,
                'message' => 'Movie not found',
                'data'    => null,
            ], 404);
        }

        // Server-side validation
        $validated = $request->validate($this->validationRules(isUpdate: true));

        // Handle poster file upload
        $posterPath = $this->handlePosterUpload($request);
        if ($posterPath) {
            $validated['poster_path'] = $posterPath;
        }

        if ($request->has('watched')) {
            $validated['watched'] = $request->boolean('watched');
        }

        $movie->update($validated);

        return response()->json([
            'success' => true,
            'status'  => 200,
            'message' => 'Movie updated',
            'data'    => $movie->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Destroy — Delete Movie
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a movie from the database.
     */
    public function destroy(int $id): JsonResponse
    {
        $movie = Movie::find($id);

        if (! $movie) {
            return response()->json([
                'success' => false,
                'status'  => 404,
                'message' => 'Movie not found',
                'data'    => null,
            ], 404);
        }

        $movie->delete();

        return response()->json([
            'success' => true,
            'status'  => 200,
            'message' => 'Movie deleted',
            'data'    => ['id' => $id],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Poster Upload Helper
    |--------------------------------------------------------------------------
    */

    /**
     * Handle poster file upload and return the stored path.
     */
    private function handlePosterUpload(Request $request): ?string
    {
        if (! $request->hasFile('poster') || ! $request->file('poster')->isValid()) {
            return null;
        }

        $file      = $request->file('poster');
        $extension = $file->getClientOriginalExtension();
        $fileName  = 'movie_' . uniqid('', true) . '.' . $extension;

        // Store in public/uploads directory
        $file->move(public_path('uploads'), $fileName);

        return 'uploads/' . $fileName;
    }
}
