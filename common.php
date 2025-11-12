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
    $demo_country = isset($_SESSION['demo_country']) ? $_SESSION['demo_country'] : 'Venezuela';
    error_log("Demo mode activated for country: " . $demo_country);
    
    // Загружаем конфигурации демо счетов
    $demo_configs = include BASE_DIR . 'demo_config.php';
    $demo_config = $demo_configs[$demo_country] ?? $demo_configs['default'];
    
    error_log("Demo config for " . $demo_country . ": " . json_encode($demo_config));
    
    $_SESSION['USER_RATE'] = 1; // Для демо режима курс всегда 1 (баланс уже в нужной валюте)
    $_SESSION['USER_CURRENCY'] = $demo_config['currency'];
    $_SESSION['aviator_demo'] = $demo_config['balance'];
    $_SESSION['demo_config'] = $demo_config; // Сохраняем всю конфигурацию
    
    $_SESSION['user'] = [
        'uid' => UID,
        'name' => 'Demo Player',
        'real_name' => 'Demo Player',
        'balance' => $demo_config['balance'],
        'host_id' => 0,
        'country' => $demo_country,
        'quick_bets' => $demo_config['quick_bets'],
        'min_bet' => $demo_config['min_bet'],
        'max_bet' => $demo_config['max_bet'],
        'default_bet' => $demo_config['default_bet']
    ];
    error_log("Demo user created: " . json_encode($_SESSION['user'])); 







