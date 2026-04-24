<?php


$SERVER = "sql105.infinityfree.com"
$username = "if0_41740219"
$password = "f2BgaZShgcEq"
$dbname = "if0_41740219_schema"

$conn = new mysqli($SERVER, $username, $password, $dbname);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}


?>