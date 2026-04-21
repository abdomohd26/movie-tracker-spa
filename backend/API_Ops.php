<?php

declare(strict_types=1);

header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", "0");

const OMDB_API_BASE_URL = "https://www.omdbapi.com/";
const OMDB_API_KEY = "3d5a25e0";

$rawInput = file_get_contents("php://input");
$input = [];

if ($rawInput !== "") {
    $decodedInput = json_decode($rawInput, true);
    if (is_array($decodedInput)) {
        $input = $decodedInput;
    }
}

if (!$input) {
    $input = $_POST;
}

$action = trim((string)($_GET["action"] ?? $input["action"] ?? ""));

try {
    switch ($action) {
        case "search":
            searchMovies();
            break;

        case "details":
            getMovieDetails();
            break;

        default:
            response(false, null, "Unsupported API action", 405);
    }
} catch (Throwable $e) {
    response(false, null, "Server error while contacting OMDb", 500);
}

function response(bool $success, $data = null, ?string $message = null, int $code = 200, array $extra = []): void
{
    http_response_code($code);

    echo json_encode(
        array_merge([
            "success" => $success,
            "status" => $code,
            "message" => $message,
            "data" => $data
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

function getOmdbApiKey(): string
{
    $apiKey = trim((string)(getenv("OMDB_API_KEY") ?: OMDB_API_KEY));

    if ($apiKey === "" || $apiKey === "YOUR_OMDB_API_KEY") {
        response(false, null, "Set your OMDb API key in backend/API_Ops.php or the OMDB_API_KEY environment variable", 500);
    }

    return $apiKey;
}

function callOmdb(array $query): array
{
    $url = OMDB_API_BASE_URL . "?" . http_build_query(array_merge($query, [
        "apikey" => getOmdbApiKey()
    ]));

    $curl = curl_init($url);

    if ($curl === false) {
        response(false, null, "Unable to initialize OMDb request", 500);
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ["Accept: application/json"]
    ]);

    $body = curl_exec($curl);
    $curlError = curl_error($curl);
    $httpCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false) {
        response(false, null, "OMDb request failed: " . ($curlError ?: "Unknown cURL error"), 502);
    }

    $decoded = json_decode((string)$body, true);
    if (!is_array($decoded)) {
        response(false, null, "OMDb returned an invalid JSON response", 502);
    }

    if ($httpCode >= 400) {
        response(false, null, "OMDb request failed", 502);
    }

    if (($decoded["Response"] ?? "False") !== "True") {
        response(false, null, trim((string)($decoded["Error"] ?? "No matching movies were found")), 404);
    }

    return $decoded;
}

function searchMovies(): void
{
    $query = trim((string)($_GET["query"] ?? ""));

    if (mb_strlen($query) < 2) {
        response(false, null, "Search query must be at least 2 characters", 400);
    }

    $omdbResponse = callOmdb([
        "s" => $query,
        "type" => "movie"
    ]);

    $movies = array_map("mapSearchMovie", $omdbResponse["Search"] ?? []);

    response(true, $movies, "Movies fetched from OMDb", 200, ["movies" => $movies]);
}

function getMovieDetails(): void
{
    $imdbId = trim((string)($_GET["imdb_id"] ?? $_GET["movie_id"] ?? ""));

    if (!preg_match("/^tt\d{5,10}$/", $imdbId)) {
        response(false, null, "A valid IMDb ID is required", 400);
    }

    $movie = callOmdb([
        "i" => $imdbId,
        "plot" => "short"
    ]);

    $mappedMovie = mapDetailedMovie($movie);
    response(true, $mappedMovie, "Movie details fetched from OMDb", 200, ["movie" => $mappedMovie]);
}

function mapSearchMovie(array $movie): array
{
    return [
        "imdb_id" => cleanText($movie["imdbID"] ?? ""),
        "title" => cleanText($movie["Title"] ?? ""),
        "release_year" => extractYear($movie["Year"] ?? ""),
        "poster_url" => normalizePosterUrl($movie["Poster"] ?? "")
    ];
}

function mapDetailedMovie(array $movie): array
{
    return [
        "imdb_id" => cleanText($movie["imdbID"] ?? ""),
        "title" => cleanText($movie["Title"] ?? ""),
        "description" => cleanText($movie["Plot"] ?? ""),
        "genre" => cleanText($movie["Genre"] ?? ""),
        "release_year" => extractYear($movie["Year"] ?? ""),
        "duration_minutes" => extractRuntimeMinutes($movie["Runtime"] ?? ""),
        "poster_url" => normalizePosterUrl($movie["Poster"] ?? ""),
        "trailer_url" => "",
        "rating" => extractRating($movie["imdbRating"] ?? ""),
        "cast" => splitList($movie["Actors"] ?? ""),
        "language" => cleanText($movie["Language"] ?? ""),
        "country" => cleanText($movie["Country"] ?? ""),
        "director" => cleanText($movie["Director"] ?? "")
    ];
}

function normalizePosterUrl($posterUrl): string
{
    $posterUrl = trim((string)$posterUrl);

    if ($posterUrl === "" || strtoupper($posterUrl) === "N/A") {
        return "";
    }

    return $posterUrl;
}

function extractYear($value): ?int
{
    if (preg_match("/\d{4}/", (string)$value, $matches)) {
        return (int)$matches[0];
    }

    return null;
}

function extractRuntimeMinutes($value): ?int
{
    if (preg_match("/\d+/", (string)$value, $matches)) {
        return (int)$matches[0];
    }

    return null;
}

function extractRating($value): ?int
{
    if (!is_numeric($value)) {
        return null;
    }

    return max(1, min(10, (int)round((float)$value)));
}

function splitList($value): array
{
    $value = cleanText($value);

    if ($value === "" || strtoupper($value) === "N/A") {
        return [];
    }

    return array_values(array_filter(array_map("trim", explode(",", $value))));
}

function cleanText($value): string
{
    $value = trim(strip_tags((string)$value));

    return strtoupper($value) === "N/A" ? "" : $value;
}
