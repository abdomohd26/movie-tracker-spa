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

