<?php
require_once "config.php";
require_once "Upload.php";

header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

$rawInput = file_get_contents("php://input");
$input = [];

if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

if (!$input) {
    $input = $_POST;
}

$method = $_SERVER["REQUEST_METHOD"];
$effectiveMethod = strtoupper($input["_method"] ?? $_GET["_method"] ?? $method);

try {
    switch ($effectiveMethod) {
        case "GET":
            getMovies($conn);
            break;

        case "POST":
            addMovie($conn, $input);
            break;

        case "PUT":
            updateMovie($conn, $input);
            break;

        case "DELETE":
            deleteMovie($conn, $input);
            break;

        default:
            response(false, null, "Method not allowed", 405);
    }
} catch (Throwable $e) {
    response(false, null, "Server error", 500);
}

function response($success, $data = null, $message = null, $code = 200, array $extra = [])
{
    http_response_code($code);

    echo json_encode(array_merge([
        "success" => $success,
        "status" => $code,
        "message" => $message,
        "data" => $data
    ], $extra));

    exit;
}

function normalizeString($value)
{
    if ($value === null) {
        return null;
    }

    $value = trim((string)$value);
    return $value === "" ? null : $value;
}

function parseInt($value)
{
    if ($value === null || $value === "") {
        return null;
    }

    if (!is_numeric($value)) {
        return false;
    }

    return (int)$value;
}

function normalizeWatched($value)
{
    if ($value === null || $value === "") {
        return null;
    }

    if ($value === true || $value === "1" || $value === 1) {
        return 1;
    }

    if ($value === false || $value === "0" || $value === 0) {
        return 0;
    }

    return false;
}

function validateTrailerUrl($value)
{
    $value = normalizeString($value);
    if ($value === null) {
        return null;
    }

    return filter_var($value, FILTER_VALIDATE_URL) ? $value : false;
}

function validateMovieInput(array $input, array $existing = null): array
{
    $title = normalizeString($input["title"] ?? ($existing["title"] ?? null));
    $description = normalizeString($input["description"] ?? ($existing["description"] ?? null));
    $genre = normalizeString($input["genre"] ?? ($existing["genre"] ?? null));
    $releaseYear = parseInt($input["release_year"] ?? ($existing["release_year"] ?? null));
    $duration = parseInt($input["duration_minutes"] ?? ($existing["duration_minutes"] ?? null));
    $watched = array_key_exists("watched", $input)
        ? normalizeWatched($input["watched"])
        : normalizeWatched($existing["watched"] ?? 0);
    $trailer = validateTrailerUrl($input["trailer_url"] ?? ($existing["trailer_url"] ?? null));
    $rating = parseInt($input["rating"] ?? ($existing["rating"] ?? null));
    $notes = normalizeString($input["notes"] ?? ($existing["notes"] ?? null));

    if (!$title) {
        response(false, null, "Title is required", 400);
    }

    if (!$genre) {
        response(false, null, "Genre is required", 400);
    }

    if ($releaseYear === false || $releaseYear === null || $releaseYear < 1888) {
        response(false, null, "release_year must be a valid year", 400);
    }

    if ($duration === false || $duration === null || $duration < 1) {
        response(false, null, "duration_minutes must be at least 1", 400);
    }

    if ($watched === false) {
        response(false, null, "watched must be 0 or 1", 400);
    }

    if ($rating === false) {
        response(false, null, "rating must be an integer", 400);
    }

    if ($rating !== null && ($rating < 1 || $rating > 10)) {
        response(false, null, "rating must be between 1 and 10", 400);
    }

    if ($trailer === false) {
        response(false, null, "trailer_url must be a valid URL", 400);
    }

    return [
        "title" => $title,
        "description" => $description,
        "genre" => $genre,
        "release_year" => $releaseYear,
        "duration_minutes" => $duration,
        "watched" => $watched ?? 0,
        "trailer_url" => $trailer,
        "rating" => $rating,
        "notes" => $notes,
    ];
}

function fetchMovieById($conn, $id)
{
    $stmt = $conn->prepare("SELECT * FROM movies WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
}

function fetchGenreOptions($conn)
{
    $stmt = $conn->prepare("SELECT genre FROM movies WHERE genre IS NOT NULL AND genre <> ''");
    $stmt->execute();
    $result = $stmt->get_result();
    $genres = [];

    while ($row = $result->fetch_assoc()) {
        foreach (explode(",", (string) $row["genre"]) as $genre) {
            $genre = trim($genre);
            if ($genre !== "") {
                $genres[$genre] = true;
            }
        }
    }

    $genreList = array_keys($genres);
    sort($genreList, SORT_NATURAL | SORT_FLAG_CASE);

    return $genreList;
}

function addMovie($conn, $input)
{
    $movie = validateMovieInput($input);
    $posterPath = handlePosterUpload("poster");

    if (!$posterPath) {
        $posterPath = normalizeString($input["poster_path"] ?? null);
    }

    $stmt = $conn->prepare("
        INSERT INTO movies
        (title, description, genre, release_year, duration_minutes, poster_path, trailer_url, watched, rating, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssiissiis",
        $movie["title"],
        $movie["description"],
        $movie["genre"],
        $movie["release_year"],
        $movie["duration_minutes"],
        $posterPath,
        $movie["trailer_url"],
        $movie["watched"],
        $movie["rating"],
        $movie["notes"]
    );

    if (!$stmt->execute()) {
        response(false, null, "Insert failed", 500);
    }

    $createdMovie = fetchMovieById($conn, $stmt->insert_id);
    response(true, $createdMovie, "Movie created", 201);
}

function getMovies($conn)
{
    $id = parseInt($_GET["id"] ?? null);
    if ($id !== null && $id !== false) {
        $movie = fetchMovieById($conn, $id);

        if (!$movie) {
            response(false, null, "Movie not found", 404);
        }

        response(true, $movie, "Movie fetched");
    }

    $title = normalizeString($_GET["search"] ?? $_GET["title"] ?? null);
    $genre = normalizeString($_GET["genre"] ?? null);
    $watched = normalizeWatched($_GET["watched"] ?? null);
    $page = parseInt($_GET["page"] ?? 1);
    $perPage = parseInt($_GET["per_page"] ?? 5);

    if ($watched === false) {
        response(false, null, "watched filter must be 0 or 1", 400);
    }

    if ($page === false || $page === null || $page < 1) {
        response(false, null, "page must be a positive integer", 400);
    }

    if ($perPage === false || $perPage === null || $perPage < 1 || $perPage > 50) {
        response(false, null, "per_page must be between 1 and 50", 400);
    }

    $whereSql = " FROM movies WHERE 1=1";
    $types = "";
    $params = [];

    if ($title !== null) {
        $whereSql .= " AND title LIKE ?";
        $types .= "s";
        $params[] = "%" . $title . "%";
    }

    if ($genre !== null) {
        $whereSql .= " AND genre LIKE ?";
        $types .= "s";
        $params[] = "%" . $genre . "%";
    }

    if ($watched !== null) {
        $whereSql .= " AND watched = ?";
        $types .= "i";
        $params[] = $watched;
    }

    $countStmt = $conn->prepare("SELECT COUNT(*) AS total" . $whereSql);
    if ($types !== "") {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $totalItems = (int) ($countResult->fetch_assoc()["total"] ?? 0);
    $totalPages = max(1, (int) ceil($totalItems / $perPage));
    $page = min($page, $totalPages);
    $offset = ($page - 1) * $perPage;

    $sql = "SELECT *" . $whereSql . " ORDER BY id DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($sql);
    $queryTypes = $types . "ii";
    $queryParams = $params;
    $queryParams[] = $perPage;
    $queryParams[] = $offset;

    $stmt->bind_param($queryTypes, ...$queryParams);

    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    response(true, $data, "Movies fetched", 200, [
        "pagination" => [
            "page" => $page,
            "per_page" => $perPage,
            "total_items" => $totalItems,
            "total_pages" => $totalPages
        ],
        "genres" => fetchGenreOptions($conn)
    ]);
}

function updateMovie($conn, $input)
{
    $id = parseInt($input["id"] ?? $_GET["id"] ?? null);
    if ($id === null || $id === false) {
        response(false, null, "ID is required", 400);
    }

    $existing = fetchMovieById($conn, $id);
    if (!$existing) {
        response(false, null, "Movie not found", 404);
    }

    $movie = validateMovieInput($input, $existing);
    $posterPath = handlePosterUpload("poster");

    if (!$posterPath) {
        $posterPath = normalizeString($input["poster_path"] ?? $existing["poster_path"]);
    }

    $stmt = $conn->prepare("
        UPDATE movies SET
        title=?, description=?, genre=?, release_year=?, duration_minutes=?, poster_path=?, trailer_url=?, watched=?, rating=?, notes=?
        WHERE id=?
    ");

    $stmt->bind_param(
        "sssiissiisi",
        $movie["title"],
        $movie["description"],
        $movie["genre"],
        $movie["release_year"],
        $movie["duration_minutes"],
        $posterPath,
        $movie["trailer_url"],
        $movie["watched"],
        $movie["rating"],
        $movie["notes"],
        $id
    );

    if (!$stmt->execute()) {
        response(false, null, "Update failed", 500);
    }

    $updatedMovie = fetchMovieById($conn, $id);
    response(true, $updatedMovie, "Movie updated");
}

function deleteMovie($conn, $input)
{
    $id = parseInt($input["id"] ?? $_GET["id"] ?? null);

    if ($id === null || $id === false) {
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
