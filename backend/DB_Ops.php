<?php
require_once "config.php";

header("Content-Type: application/json");

$action = $_GET['action'] ?? '';

switch($action) {
    case 'addMovie':
        addMovie($conn);
        break;
    case 'getMovies':
        getMovies($conn);
        break;
    case 'updateMovie':
        updateMovie($conn);
        break;
    case 'deleteMovie':
        deleteMovie($conn);
        break;
    default:
        echo json_encode(["status"=>"error","message"=>"Invalid action"]);
}

function addMovie($conn) {
    $title = $_POST['title'] ?? '';
    $genre = $_POST['genre'] ?? '';
    $year = $_POST['release_year'] ?? null;

    if(empty($title)) {
        echo json_encode(["status"=>"error","message"=>"Title required"]);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO movies (title, genre, release_year) VALUES (?, ?, ?)");
    $stmt->bind_param("ssi", $title, $genre, $year);

    if($stmt->execute()) {
        echo json_encode(["status"=>"success"]);
    } else {
        echo json_encode(["status"=>"error","message"=>"Insert failed"]);
    }
}

function getMovies($conn) {
    $result = $conn->query("SELECT * FROM movies");

    $data = [];

    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode([
        "status"=>"success",
        "data"=>$data
    ]);
}

function updateMovie($conn) {
    $id = $_POST['id'];
    $title = $_POST['title'];

    $stmt = $conn->prepare("UPDATE movies SET title=? WHERE id=?");
    $stmt->bind_param("si", $title, $id);

    if($stmt->execute()) {
        echo json_encode(["status"=>"success"]);
    } else {
        echo json_encode(["status"=>"error"]);
    }
}

function deleteMovie($conn) {
    $id = $_POST['id'];

    $stmt = $conn->prepare("DELETE FROM movies WHERE id=?");
    $stmt->bind_param("i", $id);

    if($stmt->execute()) {
        echo json_encode(["status"=>"success"]);
    } else {
        echo json_encode(["status"=>"error"]);
    }
}
