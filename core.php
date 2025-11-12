<?php 
	define('ROOTDIR', __DIR__ . '/');

	function logger( $text='' ){
		file_put_contents(
			ROOTDIR .'logs/workerman.log', 
			date('[Y-m-d H:i:s]') . $text, 
			FILE_APPEND 
		);
	} 

	require_once ROOTDIR .'classes/Singleton.class.php'; 	

	use Workerman\Worker;
	use Workerman\Connection\TcpConnection;
	use Workerman\Protocols\Http\Request; 
	use Workerman\Timer; 
	require_once __DIR__ . '/vendor/autoload.php';

	Worker::$logFile = ROOTDIR .'logs/workerman.log';
	Worker::$stdoutFile = ROOTDIR .'logs/workerman_stdout.log';
	Worker::$pidFile = ROOTDIR .'logs/workerman.pid';

	// Уровень логирования (0-4, где 4 - самый подробный)
	Worker::$daemonize = false; // Для отладки отключаем демонизацию 

/*
	$context = [
	    'ssl' => [
	        'local_cert' => '/etc/letsencrypt/live/soket.valor-games.com/fullchain.pem',
	        'local_pk' => '/etc/letsencrypt/live/soket.valor-games.com/privkey.pem',
	        'verify_peer' => false,
	        'verify_peer_name' => false,
	        'allow_self_signed' => true
	    ]
	];
*/

	$worker = new Worker('websocket://0.0.0.0:2345');//, $context); 
//	$worker->transport = 'ssl';
	$worker->count = 4; 

	$worker->onConnect = function( TcpConnection $connection ) use ( $worker ){
		logger( "New connection\n" );
	    $worker->userConnections[ $connection->id ] = $connection; 
	    $response = [
	        //'type' => 'message',
	        //'event' => 'user_connected', 
	        //'timestamp' => time(), 
	        'message' => 'User connected.'
	    ];
	    $connection->send( json_encode( $response ) );
	};

	$worker->onMessage = function( TcpConnection $connection, $data ) use ( $worker ){ 
		logger(" От клиента ". $connection->id .": ". $data ."\n"); 
		$message = json_decode( $data, true );
		$response = parse_message( $message );
		foreach( $worker->connections as $client ){ 
			$client->send( json_encode( $response ) ); 
		}
	}; 

	$timers = [
        [ 'id'=> "loading", 'time'=> 10000 ], 
        [ 'id'=> "flight", 'time'=> 30000 ], 
        [ 'id'=> "finish", 'time'=> 5000 ]  
    ];
	$cur_state = 0; 
	$start_timer = 0; 

	function parse_message( $message=[] ){ 
		$uid = isset( $message['content']['uid'] ) ? $message['content']['uid'] : 'tester';
		$text = isset( $message['content']['message'] ) ? $message['content']['message'] : 'message_'. rand( 0, 999999 ); 

		$response = [
        	//'type' => 'message',
        	//'event'=> "message", 
        	//'time' => date('H:i:s'), 
        	'content' => ['uid'=> $uid, 'message'=> $text ] 
    	]; 
    	return $response; 
	} 

	function renew_channel(){ 
		global $timers, $cur_state, $start_timer;
		$cur_timer = time(); 
		if( !$start_timer ){ $start_timer = $cur_timer; }
		$delta = $cur_timer - $start_timer; 
		if( $delta >= $timers[ $cur_state ]['time'] ){
			$cur_state += 1; 
			$cur_state = $cur_state >= count( $timers ) ? 0 : $cur_state; 
		}

		// create game 
		// start game 
		// process game 
		// finish game 

		$response = [
        	//'type' => 'message',
        	//'event'=> "message", 
        	//'time' => date('H:i:s'), 
        	'content' => [
        		'uid'=> "checker", 
        		'message'=> "renew state result: current state ". $timers[ $cur_state ]['id'] ."; cur delta: ". $delta ."\n"  
        	] 
    	];

    	return $response; 
	}


	Timer::add( 1, function() use ($worker) { 
		$response = renew_channel(); 
		logger(json_encode( $response ) ."\n"); 
		foreach( $worker->connections as $client ){ 
			$client->send( json_encode( $response ) ); 
		}
	});

	Worker::runAll();



