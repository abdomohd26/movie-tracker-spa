<?php
require_once "config.php";

header("Content-Type: application/json; charset=UTF-8");

// Hide errors in production
error_reporting(E_ALL);
ini_set('display_errors', 0);

// ===== Read JSON or fallback to POST =====
$rawInput = file_get_contents("php://input");
$input = [];

if (!empty($rawInput)) {
    $input = json_decode($rawInput, true);
}

if (!$input) {
    $input = $_POST;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            getMovies($conn);
            break;

        case 'POST':
            addMovie($conn, $input);
            break;

        case 'PUT':
            updateMovie($conn, $input);
            break;

        case 'DELETE':
            deleteMovie($conn, $input);
            break;

        default:
            response(false, null, "Method not allowed", 405);
    }
} catch (Throwable $e) {
    response(false, null, "Server error", 500);
}

function response($success, $data = null, $message = null, $code = 200)
{
    http_response_code($code);

    echo json_encode([
        "success" => $success,
        "status" => $code,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function normalizeString($value)
{
    if ($value === null) return null;
    $value = trim((string)$value);
    return $value === "" ? null : $value;
}

function parseInt($value)
{
    if ($value === null || $value === "") return null;
    if (!is_numeric($value)) return false;
    return (int)$value;
}

function fetchMovieById($conn, $id)
{
    $stmt = $conn->prepare("SELECT * FROM movies WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

// ===== CREATE =====
function addMovie($conn, $input)
{
    $title = normalizeString($input['title'] ?? null);
    $description = normalizeString($input['description'] ?? null);
    $genre = normalizeString($input['genre'] ?? null);
    $releaseYear = parseInt($input['release_year'] ?? null);
    $duration = parseInt($input['duration_minutes'] ?? null);
    $watched = isset($input['watched']) ? (int)$input['watched'] : 0;
    $poster = normalizeString($input['poster_path'] ?? null);
    $trailer = normalizeString($input['trailer_url'] ?? null);
    $rating = parseInt($input['rating'] ?? null);
    $notes = normalizeString($input['notes'] ?? null);

    if (!$title) {
        response(false, null, "Title is required", 400);
    }

    if ($releaseYear === false) {
        response(false, null, "release_year must be integer", 400);
    }

    if ($duration === false) {
        response(false, null, "duration_minutes must be integer", 400);
    }

    $stmt = $conn->prepare("
        INSERT INTO movies 
        (title, description, genre, release_year, duration_minutes, poster_path, trailer_url, watched, rating, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssiissiis",
        $title,
        $description,
        $genre,
        $releaseYear,
        $duration,
        $poster,
        $trailer,
        $watched,
        $rating,
        $notes
    );

    if (!$stmt->execute()) {
        response(false, null, "Insert failed", 500);
    }

    $id = $stmt->insert_id;
    $movie = fetchMovieById($conn, $id);

    response(true, $movie, "Movie created", 201);
}

function getMovies($conn)
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM movies WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        $result = $stmt->get_result();
        $movie = $result->fetch_assoc();

        if (!$movie) {
            response(false, null, "Movie not found", 404);
        }

        response(true, $movie, "Movie fetched");
    }

    $result = $conn->query("SELECT * FROM movies ORDER BY id DESC");

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    response(true, $data, "Movies fetched");
}

function updateMovie($conn, $input)
{
    $id = $input['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        response(false, null, "ID is required", 400);
    }

    $existing = fetchMovieById($conn, $id);
    if (!$existing) {
        response(false, null, "Movie not found", 404);
    }

    $title = normalizeString($input['title'] ?? $existing['title']);
    $description = normalizeString($input['description'] ?? $existing['description']);
    $genre = normalizeString($input['genre'] ?? $existing['genre']);
    $releaseYear = parseInt($input['release_year'] ?? $existing['release_year']);
    $duration = parseInt($input['duration_minutes'] ?? $existing['duration_minutes']);
    $watched = isset($input['watched']) ? (int)$input['watched'] : $existing['watched'];
    $poster = normalizeString($input['poster_path'] ?? $existing['poster_path']);
    $trailer = normalizeString($input['trailer_url'] ?? $existing['trailer_url']);
    $rating = parseInt($input['rating'] ?? ($existing['rating'] ?? null));
    $notes = normalizeString($input['notes'] ?? $existing['notes']);

    if (!$title) {
        response(false, null, "Title is required", 400);
    }

    $stmt = $conn->prepare("
        UPDATE movies SET
        title=?, description=?, genre=?, release_year=?, duration_minutes=?, poster_path=?, trailer_url=?, watched=?, rating=?, notes=?
        WHERE id=?
    ");

    $stmt->bind_param(
        "sssiissiisi",
        $title,
        $description,
        $genre,
        $releaseYear,
        $duration,
        $poster,
        $trailer,
        $watched,
        $rating,
        $notes,
        $id
    );

    if (!$stmt->execute()) {
        response(false, null, "Update failed", 500);
    }

    $movie = fetchMovieById($conn, $id);

    response(true, $movie, "Movie updated");
}

function deleteMovie($conn, $input)
{
    $id = $input['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        response(false, null, "ID is required", 400);
    }

    $existing = fetchMovieById($conn, $id);
    if (!$existing) {
        response(false, null, "Movie not found", 404);
    }

    $stmt = $conn->prepare("DELETE FROM movies WHERE id=?");
    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        response(false, null, "Delete failed", 500);
    }

    response(true, ["id" => $id], "Movie deleted");
}