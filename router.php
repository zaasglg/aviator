<?php 
    $link = "";
    $request_uri = isset( $_REQUEST['route'] ) && $_REQUEST['route'] ? $_REQUEST['route'] : $_SERVER['REQUEST_URI'];
	if( $request_uri ){
		$link = explode('?', $request_uri );
		$link = explode('/', preg_replace('/^\//', '', $link[0] ) );
		// Remove valorgames/aviator from path if present
		if( isset($link[0]) && $link[0] == 'valorgames' && isset($link[1]) && $link[1] == 'aviator' ){
			$link = array_slice($link, 2);
		}
	} 
	$body =  $link ? $link : array(""); 

	if( $body[0] == "api" ){ 
		define('ISAPI', true );
		define('CONTROLLER', isset( $body[1] ) ? $body[1] : "" );
		define('ACTION', isset( $body[2] ) ? $body[2] : "" ); 
		define('ITEM_ID',  isset( $body[3] ) ? App::uid( $body[3] ) : ( isset( $body[2] ) ? App::uid($body[2]) : "" ) );
		define('ITEM_PARAM', isset( $body[4] ) ? App::uid( $body[4] ) : ( isset( $body[3] ) ? App::uid( $body[3] ) : ( isset( $body[2] ) ? App::uid($body[2]) : "" ) ) );
		define('ITEM_ADD', isset( $body[4] ) ? App::uid( $body[4] ) : ( isset( $body[3] ) ? App::uid( $body[3] ) : ( isset( $body[2] ) ? App::uid($body[2]) : "" ) ) );
	}
	else {
		define('ISAPI', false);
		// Handle index.php as main controller
		if( $body[0] == "index.php" || ($body[0] == "aviator" && $body[1] == "index.php") ){
			define('CONTROLLER', "main");
		} else {
			define('CONTROLLER', ( $body[0] ? $body[0] : "main" ) );
		}
		define('ACTION', isset( $body[1] ) ? $body[1] : "" ); 
		define('ITEM_ID', isset( $body[2] ) ? App::uid( $body[2] ) : ( isset( $body[1] ) ? App::uid($body[1]) : "" ) );
		define('ITEM_PARAM', isset( $body[3] ) ? App::uid( $body[3] ) : ( isset( $body[2] ) ? App::uid( $body[2] ) : ( isset( $body[1] ) ? App::uid($body[1]) : "" ) ) );
		define('ITEM_ADD', isset( $body[4] ) ? App::uid( $body[4] ) : ( isset( $body[3] ) ? App::uid( $body[3] ) : ( isset( $body[2] ) ? App::uid($body[2]) : "" ) ) );
	}

	if( ISAPI ){ header("Content-Type: text/json; charset=utf-8"); } 
	else { header("Content-Type: text/html; charset=utf-8"); } 

    if( !ISAPI ){ 
        if( defined('CONTROLLER') ){ 
            $controller = TPL_DIR . CONTROLLER . INC_EXT;
            if( is_file( $controller ) ){ 
                include_once $controller; 
            }
            if( CONTROLLER ){ 
                switch( CONTROLLER ){ 
                    // авторизация
                    case "auth": define('TPL', AUTH ? "main" : "auth" ); break; 
                    // служебка для капчи
                    case "captcha": include_once BASE_DIR ."captcha.inc.php"; exit(); break;  
                    // служебка получить изображение
                    case "image": Image::get( ACTION ); exit(); break;  
                    // выход из системы
                    case "logout": Users::logout(); exit(); break; 
                    // главная
                    case "main": define('TPL', "main"); break; 
                    // служебка загрузка файлов
                    case "upload": include_once BASE_DIR ."upload.php"; exit(); break;  
                    // настройки
                    case "stat": define('TPL', "stat"); break; 

                } 
            }
            else { 
                define('TPL', "main" );
            }
        } 
        else {
            define('CONTROLLER', "main");
            define('TPL', "main" );
        } 
    }


