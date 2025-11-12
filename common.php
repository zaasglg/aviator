<?php
	//
	// GAME DATA
	//
	define('HOST_ID', ( isset( $_REQUEST['user_id'] ) ? $_REQUEST['user_id'] : 'demo' )); 
    
    // Подключаем функции конвертации валют
    require_once BASE_DIR . 'currency.php';
    
    error_log("Common.php - HOST_ID: " . HOST_ID . ", AUTH: " . AUTH . ", UID: " . UID);
    
    // Отладочная информация - используем /tmp для записи логов
    $debug_file = '/tmp/aviator_debug.log';
    file_put_contents($debug_file, date('Y-m-d H:i:s') . " - HOST_ID: " . HOST_ID . ", AUTH: " . AUTH . ", UID: " . UID . "\n", FILE_APPEND);
    file_put_contents($debug_file, date('Y-m-d H:i:s') . " - _GET: " . json_encode($_GET) . "\n", FILE_APPEND);
    file_put_contents($debug_file, date('Y-m-d H:i:s') . " - _REQUEST: " . json_encode($_REQUEST) . "\n", FILE_APPEND);
    
    // Database connection removed - Demo mode only
    error_log("Demo mode activated");
    $_SESSION['USER_RATE'] = 1; 
    $_SESSION['aviator_demo'] = 500; // Демо баланс
    $_SESSION['user'] = [
        'uid' => UID,
        'name' => 'Demo Player',
        'real_name' => 'Demo Player',
        'balance' => 500,
        'host_id' => 0
    ];
    error_log("Demo user created: " . json_encode($_SESSION['user'])); 







