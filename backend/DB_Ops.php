<?php
require_once "config.php";

header("Content-Type: application/json");

// Read JSON input once
$input = json_decode(file_get_contents("php://input"), true) ?? [];

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
} catch (Exception $e) {
    response(false, null, "Server error: " . $e->getMessage(), 500);
}

function response($success, $data = null, $error = null, $code = 200) {
    http_response_code($code);

    echo json_encode([
        "success" => $success,
        "data" => $data,
        "error" => $error
    ]);

    exit;
}

function addMovie($conn, $input) {
    $title = trim($input['title'] ?? '');
    $genre = trim($input['genre'] ?? '');
    $year  = $input['release_year'] ?? null;

    if ($title === '') {
        response(false, null, "Title is required", 400);
    }

    $stmt = $conn->prepare(
        "INSERT INTO movies (title, genre, release_year) VALUES (?, ?, ?)"
    );

    $stmt->bind_param("ssi", $title, $genre, $year);

    if ($stmt->execute()) {
        response(true, ["id" => $stmt->insert_id], null, 201);
    }

    response(false, null, "Insert failed", 500);
}

function getMovies($conn) {
    $result = $conn->query("SELECT * FROM movies");

    $data = [];

    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    response(true, $data);
}

function updateMovie($conn, $input) {
    $id = $input['id'] ?? null;
    $title = $input['title'] ?? null;

    if (!$id) {
        response(false, null, "ID is required", 400);
    }

    if (!$title) {
        response(false, null, "Title is required", 400);
    }

    $stmt = $conn->prepare("UPDATE movies SET title=? WHERE id=?");
    $stmt->bind_param("si", $title, $id);

    if (!$stmt->execute()) {
        response(false, null, "Update failed", 500);
    }

    if ($stmt->affected_rows === 0) {
        response(false, null, "Movie not found or no changes made", 404);
    }

    response(true, ["id" => $id], null, 200);
}

function deleteMovie($conn, $input) {
    $id = $input['id'] ?? null;

    if (!$id) {
        response(false, null, "ID is required", 400);
    }

    $stmt = $conn->prepare("DELETE FROM movies WHERE id=?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows === 0) {
            response(false, null, "Movie not found", 404);
        }

        response(true, null);
    }

    response(false, null, "Delete failed", 500);
}
