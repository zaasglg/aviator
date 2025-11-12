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
    
    // Устанавливаем валюту для демо режима на основе страны
    $currency_map = [
        'Argentina' => 'ARS',
        'Bolivia' => 'BOB',
        'Brazil' => 'BRL',
        'Chile' => 'CLP',
        'Colombia' => 'COP',
        'Costa Rica' => 'CRC',
        'Cuba' => 'CUP',
        'Dominican Republic' => 'DOP',
        'Ecuador' => 'USD',
        'El Salvador' => 'USD',
        'Guatemala' => 'Q',
        'Haiti' => 'HTG',
        'Honduras' => 'HNL',
        'Mexico' => 'MXN',
        'Nicaragua' => 'NIO',
        'Panama' => 'USD',
        'Paraguay' => 'PYG',
        'Peru' => 'PEN',
        'Puerto Rico' => 'USD',
        'Uruguay' => 'UYU',
        'Venezuela' => 'VES',
    ];
    
    $exchange_rates = [
        'ARS' => 350, 'BOB' => 6.9, 'BRL' => 5.0, 'CLP' => 800,
        'COP' => 4000, 'CRC' => 520, 'CUP' => 24, 'DOP' => 56,
        'USD' => 1, 'Q' => 7.8, 'HTG' => 132, 'HNL' => 24.5,
        'MXN' => 17, 'NIO' => 36.5, 'PYG' => 7200, 'PEN' => 3.7,
        'UYU' => 39, 'VES' => 36
    ];
    
    $demo_currency = $currency_map[$demo_country] ?? 'USD';
    $demo_rate = $exchange_rates[$demo_currency] ?? 1;
    
    $_SESSION['USER_RATE'] = $demo_rate; 
    $_SESSION['USER_CURRENCY'] = $demo_currency;
    $_SESSION['aviator_demo'] = 500; // Демо баланс в USD
    $_SESSION['user'] = [
        'uid' => UID,
        'name' => 'Demo Player',
        'real_name' => 'Demo Player',
        'balance' => 500,
        'host_id' => 0,
        'country' => $demo_country
    ];
    error_log("Demo user created: " . json_encode($_SESSION['user'])); 







