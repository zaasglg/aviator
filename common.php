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
    
    // Загружаем конфигурации для всех режимов
    $game_configs = include BASE_DIR . 'demo_config.php';
    
    // Определяем страну пользователя
    $user_country = 'Venezuela'; // По умолчанию
    
    if (isset($_SESSION['demo_mode']) && $_SESSION['demo_mode']) {
        // DEMO MODE
        $user_country = isset($_SESSION['demo_country']) ? $_SESSION['demo_country'] : 'Venezuela';
        error_log("Demo mode activated for country: " . $user_country);
        
        $game_config = $game_configs[$user_country] ?? $game_configs['default'];
        
        $_SESSION['USER_RATE'] = 1;
        $_SESSION['USER_CURRENCY'] = $game_config['currency'];
        $_SESSION['aviator_demo'] = $game_config['balance'];
        $_SESSION['game_config'] = $game_config;
        
        $_SESSION['user'] = [
            'uid' => UID,
            'name' => 'Demo Player',
            'real_name' => 'Demo Player',
            'balance' => $game_config['balance'],
            'host_id' => 0,
            'country' => $user_country,
            'quick_bets' => $game_config['quick_bets'],
            'min_bet' => $game_config['min_bet'],
            'max_bet' => $game_config['max_bet'],
            'default_bet' => $game_config['default_bet']
        ];
        error_log("Demo user created: " . json_encode($_SESSION['user']));
    } else {
        // REAL MODE
        error_log("Real mode activated");
        
        // Получаем страну пользователя из сессии (из URL или JWT токена)
        $user_country = isset($_SESSION['user_country']) ? $_SESSION['user_country'] : 'Venezuela';
        error_log("Real mode country: " . $user_country . " (from session: " . (isset($_SESSION['user_country']) ? 'yes' : 'no') . ")");
        
        $game_config = $game_configs[$user_country] ?? $game_configs['default'];
        error_log("Game config for " . $user_country . ": " . json_encode($game_config));
        
        $_SESSION['USER_RATE'] = 1;
        $_SESSION['USER_CURRENCY'] = $game_config['currency'];
        $_SESSION['game_config'] = $game_config;
        
        // В реальном режиме баланс берется из БД пользователя
        // TODO: Интегрировать с реальной БД когда будет подключение
        $user_balance = 500; // Временное значение
        
        $_SESSION['user'] = [
            'uid' => UID,
            'name' => 'Player',
            'real_name' => 'Player',
            'balance' => $user_balance,
            'host_id' => AUTH ? (int)AUTH : 0,
            'country' => $user_country,
            'quick_bets' => $game_config['quick_bets'],
            'min_bet' => $game_config['min_bet'],
            'max_bet' => $game_config['max_bet'],
            'default_bet' => $game_config['default_bet']
        ];
        error_log("Real user created: " . json_encode($_SESSION['user']));
    } 







