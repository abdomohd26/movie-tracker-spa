<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Service class for OMDb third-party API integration.
 *
 * API keys are stored in .env and accessed via config('services.omdb.key').
 * All HTTP calls use Laravel's built-in Http client.
 */
class OmdbService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.omdb.base_url', 'https://www.omdbapi.com/');
        $this->apiKey  = config('services.omdb.key', '');
    }

    /*
    |--------------------------------------------------------------------------
    | Search movies on OMDb
    |--------------------------------------------------------------------------
    */

    /**
     * Search OMDb for movies matching the given query.
     *
     * @throws \RuntimeException if the API call fails
     */
    public function search(string $query): array
    {
        $response = $this->callOmdb([
            's'    => $query,
            'type' => 'movie',
        ]);

        return array_map(
            fn ($movie) => $this->mapSearchMovie($movie),
            $response['Search'] ?? []
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Get movie details from OMDb
    |--------------------------------------------------------------------------
    */

    /**
     * Get detailed movie information from OMDb by IMDb ID.
     *
     * @throws \RuntimeException if the API call fails
     */
    public function getDetails(string $imdbId): array
    {
        $response = $this->callOmdb([
            'i'    => $imdbId,
            'plot' => 'short',
        ]);

        return $this->mapDetailedMovie($response);
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Make an HTTP request to the OMDb API.
     * Uses Laravel's Http facade for clean, testable HTTP calls.
     *
     * @throws \RuntimeException on any failure
     */
    private function callOmdb(array $params): array
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('OMDb API key is not configured. Set OMDB_API_KEY in your .env file.');
        }

        $params['apikey'] = $this->apiKey;

        $response = Http::timeout(20)
            ->connectTimeout(10)
            ->acceptJson()
            ->get($this->baseUrl, $params);

        if ($response->failed()) {
            throw new \RuntimeException('OMDb request failed');
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new \RuntimeException('OMDb returned an invalid response');
        }

        if (($data['Response'] ?? 'False') !== 'True') {
            throw new \RuntimeException(
                trim($data['Error'] ?? 'No matching movies were found')
            );
        }

        return $data;
    }

    /**
     * Map an OMDb search result to our application format.
     */
    private function mapSearchMovie(array $movie): array
    {
        return [
            'imdb_id'      => $this->cleanText($movie['imdbID'] ?? ''),
            'title'        => $this->cleanText($movie['Title'] ?? ''),
            'release_year' => $this->extractYear($movie['Year'] ?? ''),
            'poster_url'   => $this->normalizePosterUrl($movie['Poster'] ?? ''),
        ];
    }

    /**
     * Map an OMDb detailed result to our application format.
     */
    private function mapDetailedMovie(array $movie): array
    {
        return [
            'imdb_id'          => $this->cleanText($movie['imdbID'] ?? ''),
            'title'            => $this->cleanText($movie['Title'] ?? ''),
            'description'      => $this->cleanText($movie['Plot'] ?? ''),
            'genre'            => $this->cleanText($movie['Genre'] ?? ''),
            'release_year'     => $this->extractYear($movie['Year'] ?? ''),
            'duration_minutes' => $this->extractRuntimeMinutes($movie['Runtime'] ?? ''),
            'poster_url'       => $this->normalizePosterUrl($movie['Poster'] ?? ''),
            'trailer_url'      => '',
            'rating'           => $this->extractRating($movie['imdbRating'] ?? ''),
            'cast'             => $this->splitList($movie['Actors'] ?? ''),
            'language'         => $this->cleanText($movie['Language'] ?? ''),
            'country'          => $this->cleanText($movie['Country'] ?? ''),
            'director'         => $this->cleanText($movie['Director'] ?? ''),
        ];
    }

    private function cleanText($value): string
    {
        $value = trim(strip_tags((string) $value));
        return strtoupper($value) === 'N/A' ? '' : $value;
    }

    private function normalizePosterUrl($url): string
    {
        $url = trim((string) $url);
        return ($url === '' || strtoupper($url) === 'N/A') ? '' : $url;
    }

    private function extractYear($value): ?int
    {
        return preg_match('/\d{4}/', (string) $value, $m) ? (int) $m[0] : null;
    }

    private function extractRuntimeMinutes($value): ?int
    {
        return preg_match('/\d+/', (string) $value, $m) ? (int) $m[0] : null;
    }

    private function extractRating($value): ?int
    {
        return is_numeric($value) ? max(1, min(10, (int) round((float) $value))) : null;
    }

    private function splitList($value): array
    {
        $value = $this->cleanText($value);
        if ($value === '') {
            return [];
        }
        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }
}
