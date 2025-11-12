<?php 
	error_reporting( E_ALL );
	ini_set( 'display_errors', 'On' );
	ini_set("max_execution_time", 30); 
	ini_set('session.gc_maxlifetime', 43200);
	ini_set('session.cookie_lifetime', 43200);
	ini_set('session.save_path', '/tmp');
	session_set_cookie_params(0);
	ini_set("session.use_cookies", 1 ); 
	// session.use_only_cookies = 1
	ini_set("session.use_trans_sid", "off");
	if( session_id() == '' ){ session_start(); }
	ini_set('memory_limit', '128M');
	ini_set("file_uploads", 1);
	ini_set("upload_tmp_dir", "/tmp");
	ini_set("upload_max_filesize", "10M");
	ini_set("max_file_uploads", 3);

	//date_default_timezone_set('Europe/Moscow');
	//header("Content-Type: text/html; charset=utf-8");
	header("Access-Control-Allow-Origin:*");
    //header("Access-Control-Allow-Credentials=true");

	if( !defined('BASE_DIR') ){
		define('BASE_DIR', dirname(__FILE__)."/");
	}

	include_once BASE_DIR ."config.php"; 
	//
	function cls( $class ){ 
		$filePath = CLASS_DIR . str_replace('_',"/", $class) .CLASS_EXT; 
		if( is_file( $filePath ) ){ require_once( $filePath ); }
		else { 
			$filePath = MODELS_DIR . str_replace('_',"/", $class) .CLASS_EXT; 
			if( is_file( $filePath ) ){ require_once( $filePath ); }
			else { 
				//$filePath = stream_resolve_include_path( TRAITS_DIR . $traitName . TRAITS_EXT );
				$filePath = stream_resolve_include_path( TRAITS_DIR . $class . TRAITS_EXT );
				if( is_file( $filePath ) ){ require_once $filePath; }
				else { echo '<h1>include error: '. $class .'</h1>'; }
			}
		}
	}
	spl_autoload_register( 'cls' );  

	//include_once BASE_DIR ."errorhandler.php"; 

	$input = json_decode( file_get_contents('php://input'), 1, 1024 );

	// Карта валют и курсов (используется в нескольких местах)
	$currency_map = [
		'Argentina' => 'ARS', 'Bolivia' => 'BOB', 'Brazil' => 'BRL', 'Chile' => 'CLP',
		'Colombia' => 'COP', 'Costa Rica' => 'CRC', 'Cuba' => 'CUP', 'Dominican Republic' => 'DOP',
		'Ecuador' => 'USD', 'El Salvador' => 'USD', 'Guatemala' => 'Q', 'Haiti' => 'HTG',
		'Honduras' => 'HNL', 'Mexico' => 'MXN', 'Nicaragua' => 'NIO', 'Panama' => 'USD',
		'Paraguay' => 'PYG', 'Peru' => 'PEN', 'Puerto Rico' => 'USD', 'Uruguay' => 'UYU',
		'Venezuela' => 'VES',
	];
	
	$exchange_rates = [
		'ARS' => 350, 'BOB' => 6.9, 'BRL' => 5.0, 'CLP' => 800,
		'COP' => 4000, 'CRC' => 520, 'CUP' => 24, 'DOP' => 56,
		'USD' => 1, 'Q' => 7.8, 'HTG' => 132, 'HNL' => 24.5,
		'MXN' => 17, 'NIO' => 36.5, 'PYG' => 7200, 'PEN' => 3.7,
		'UYU' => 39, 'VES' => 36
	];
	
	//
	// SETTINGS
	//
	define('ROBOT', isset( $_SESSION['ROBOT'] ) ? false : true );
	
	// Логирование для отладки авторизации
	error_log("Aviator Auth Debug:");
	error_log("_SESSION: " . json_encode($_SESSION));
	error_log("_REQUEST: " . json_encode($_REQUEST));
	error_log("_GET: " . json_encode($_GET));
	
	// Проверяем параметры URL для режима игры
	$is_demo_mode = isset($_GET['demo']) && $_GET['demo'] === 'true';
	$access_token = isset($_GET['access_token']) ? $_GET['access_token'] : null;
	$country = isset($_GET['country']) ? $_GET['country'] : null; // Может быть null
	
	// Проверяем разные варианты авторизации
    $auth_user_id = false;
    
    // Режим 1: Demo mode
    if ($is_demo_mode) {
        $demo_country = $country ?? 'Venezuela';
        error_log("Demo mode activated with country: " . $demo_country);
        $_SESSION['demo_mode'] = true;
        $_SESSION['demo_country'] = $demo_country;
        $auth_user_id = false; // Нет авторизации в демо режиме
    }
    // Режим 2: Real mode с access_token
    elseif ($access_token) {
        error_log("Real mode with access_token");
        
        // Сначала проверяем параметр country в URL
        if ($country) {
            $_SESSION['user_country'] = $country;
            error_log("User country from URL: " . $country);
        }
        
        // Декодируем JWT токен
        try {
            // Простое декодирование JWT (без проверки подписи для примера)
            $token_parts = explode('.', $access_token);
            if (count($token_parts) === 3) {
                $payload = json_decode(base64_decode($token_parts[1]), true);
                if (isset($payload['user_id'])) {
                    $auth_user_id = $payload['user_id'];
                    $_SESSION['user_id'] = $auth_user_id;
                    $_SESSION['access_token'] = $access_token;
                    
                    // Сохраняем страну из токена если есть (только если не было в URL)
                    if (!$country && isset($payload['country'])) {
                        $_SESSION['user_country'] = $payload['country'];
                        error_log("User country from token: " . $payload['country']);
                    }
                    
                    error_log("Decoded user_id from token: " . $auth_user_id);
                }
            }
        } catch (Exception $e) {
            error_log("Error decoding access_token: " . $e->getMessage());
        }
    }
    // Режим 3: Старый способ с user_id
    elseif (isset($_GET['user_id'])) {
        $auth_user_id = $_GET['user_id'];
        $_SESSION['user_id'] = $auth_user_id;
        error_log("Found user_id in GET: " . $auth_user_id);
    } elseif (isset($_REQUEST['user_id'])) {
        $auth_user_id = $_REQUEST['user_id'];
        $_SESSION['user_id'] = $auth_user_id;
        error_log("Found user_id in request: " . $auth_user_id);
    } elseif (isset($_SESSION['user_id'])) {
        $auth_user_id = $_SESSION['user_id'];
        error_log("Found user_id in session: " . $auth_user_id);
    } elseif (isset($_SESSION['id'])) {
        $auth_user_id = $_SESSION['id'];
        error_log("Found id in session: " . $auth_user_id);
    }
	
	define('AUTH', $auth_user_id);
	error_log("Final AUTH value: " . AUTH); 
	
	// Создаем UID для и��ры на основе user_id из основной базы данных
	$game_uid = false;
	if (AUTH) {
		// Создаем уникальный UID для игры на основе user_id
		$game_uid = 'u' . AUTH; // Префикс 'u' + user_id
	} else {
		// Для демо режима создаем временный UID
		$game_uid = 'demo_' . uniqid();
	}
	
	define('UID', $game_uid);  
	
	// Определяем валюту ПОСЛЕ обработки параметров URL
	$user_currency = "USD";
	$user_rate = 1;
	
	// Если демо режим с указанной страной
	if ($is_demo_mode && isset($country)) {
		$user_currency = $currency_map[$country] ?? 'USD';
		$user_rate = $exchange_rates[$user_currency] ?? 1;
		error_log("Demo mode currency: " . $user_currency . " for country: " . $country);
	}
	// Если есть авторизованный пользователь, пытаемся получить его страну
	elseif (AUTH) {
		// Здесь можно добавить запрос к БД для получения страны пользователя
		// Пока используем USD по умолчанию
		$user_currency = "USD";
		$user_rate = 1;
	}
	
	define('CURRENCY', $user_currency);
	define('USER_RATE', $user_rate);
	
	$_SESSION['USER_RATE'] = $user_rate;
	$_SESSION['USER_CURRENCY'] = $user_currency;
	
	error_log("Final CURRENCY: " . CURRENCY . ", USER_RATE: " . USER_RATE);
	
	//
	//
	if( isset( $_SESSION['ADMIN'] ) ){ define('ADMIN', $_SESSION['ADMIN'] ); } 
	else {
		if( isset( $_SESSION['user']['role_name'] ) && $_SESSION['user']['role_name'] == "ADMIN" ){ 
			$_SESSION['ADMIN'] = true;
			define('ADMIN', true ); 
		} 
		else { define('ADMIN', false ); }
	}  
	




	