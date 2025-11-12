<?php
session_start();
require_once 'init.php';

header('Content-Type: application/json');

try {
    if (!isset($_SESSION['user']['uid'])) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $users = Users::GI();
    $user = $users->get(['uid' => $_SESSION['user']['uid']]);
    
    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $response = [
        'balance' => $user['balance'],
        'user' => $user,
        'status' => 'success'
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
