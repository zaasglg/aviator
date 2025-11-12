<?php
session_start();
require_once 'init.php';

header('Content-Type: application/json');

// Database connection removed
echo json_encode(['error' => 'Database connection removed']);
?>
