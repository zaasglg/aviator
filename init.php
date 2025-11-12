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

	// Определяем валюту пользователя и курс обмена
	$user_currency = "USD"; // По умолчанию USD
	$user_rate = 1; // Курс по умолчанию 1 для USD
	
	if (isset($_SESSION['user_id'])) {
		// Подключаемся к базе данных для получения страны пользователя
		try {
			include_once BASE_DIR . "../db.php";
			$stmt = $conn->prepare("SELECT country FROM users WHERE user_id = :user_id");
			$stmt->execute([':user_id' => $_SESSION['user_id']]);
			$user = $stmt->fetch(PDO::FETCH_ASSOC);
			
			if ($user && isset($user['country'])) {
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
				
				// Курсы валют к USD (примерные курсы, можно обновлять через API)
				$exchange_rates = [
					'ARS' => 350,    // Аргентинский песо
					'BOB' => 6.9,    // Боливийский боливиано
					'BRL' => 5.0,    // Бразильский реал
					'CLP' => 800,    // Чилийский песо
					'COP' => 4000,   // Колумбийский песо
					'CRC' => 520,    // Костариканский колон
					'CUP' => 24,     // Кубинский песо
					'DOP' => 56,     // Доминиканский песо
					'USD' => 1,      // Доллар США
					'Q' => 7.8,      // Гватемальский кетсаль
					'HTG' => 132,    // Гаитянский ��урд
					'HNL' => 24.5,   // Гондурасская лемпира
					'MXN' => 17,     // Мексиканский песо
					'NIO' => 36.5,   // Никарагуанская кордоба
					'PYG' => 7200,   // Парагвайский гуарани
					'PEN' => 3.7,    // Перуанский соль
					'UYU' => 39,     // Уругвайский песо
					'VES' => 36,     // Венесуэльский боливар
				];
				
				$user_currency = $currency_map[$user['country']] ?? 'USD';
				$user_rate = $exchange_rates[$user_currency] ?? 1;
			}
		} catch (Exception $e) {
			// В случае ошибки используем USD по умолчанию
			$user_currency = "USD";
			$user_rate = 1;
		}
	}
	
	define('CURRENCY', $user_currency);
	define('USER_RATE', $user_rate);
	
	// Сохраняем курс в сессии для использования в других частях игры
	$_SESSION['USER_RATE'] = $user_rate;
	$_SESSION['USER_CURRENCY'] = $user_currency;
	//
	// SETTINGS
	//
	define('ROBOT', isset( $_SESSION['ROBOT'] ) ? false : true );
	
	// Логирование для отладки авторизации
	error_log("Aviator Auth Debug:");
	error_log("_SESSION: " . json_encode($_SESSION));
	error_log("_REQUEST: " . json_encode($_REQUEST));
	error_log("_GET: " . json_encode($_GET));
	
	// Проверяем разные варианты авторизации
    $auth_user_id = false;
    if (isset($_GET['user_id'])) {
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
	




	