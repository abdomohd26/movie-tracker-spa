<?php

function handlePosterUpload($fileField = "poster")
{
    if (!isset($_FILES[$fileField])) {
        return null;
    }

    $file = $_FILES[$fileField];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        response(false, null, "Failed to upload image", 400);
    }

    $fileName = $file['name'];
    $tmpName = $file['tmp_name'];
    $fileSize = $file['size'];

    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($ext, $allowed, true)) {
        response(false, null, "Invalid image type", 400);
    }

    if ($fileSize > 2 * 1024 * 1024) {
        response(false, null, "Image too large", 400);
    }

    if (getimagesize($tmpName) === false) {
        response(false, null, "File is not an image", 400);
    }

    $uploadDir = "../uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $newName = uniqid("movie_", true) . "." . $ext;
    $uploadPath = $uploadDir . $newName;

    if (!move_uploaded_file($tmpName, $uploadPath)) {
        response(false, null, "Failed to upload image", 500);
    }

    return "uploads/" . $newName;
}
