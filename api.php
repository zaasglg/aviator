<?php 
	error_reporting(E_ALL);
	ini_set('display_errors', 1);
	
	$post = $_REQUEST; 
	$input = json_decode( file_get_contents('php://input'), 1, 1024 ); 
	$return = array('error'=>1, 'msg'=>"UNAUTHORIZED"); 

	$data = array_merge( $post, $input ? $input : [] );

	$fields = isset( $data['fields'] ) ? $data['fields'] : false; 
	$cond = isset( $data['cond'] ) ? $data['cond'] : false; 

	// Логирование для отладки
	if(ACTION == 'add' && CONTROLLER == 'bets') {
		error_log("Aviator Bet Add - Data: " . json_encode($data));
	}

	$CLASS = "";
//
// VARIABLES
//
	function cmp_function($a, $b, $c){ return ($a[$c] > $b[$c]); } // ASC  uasort($array, 'cmp_function');
	function cmp_function_desc($a, $b, $c){ return ($a[$c] < $b[$c]); } // DESC  uasort($array, 'cmp_function_desc');

	switch( CONTROLLER ){ 
		case "bets": $CLASS = Bets::getInstance(); break; 
		case "cfs": $CLASS = Cfs::getInstance(); break; 
		case "games": $CLASS = Games::getInstance(); break; 
		case "users": $CLASS = Users::getInstance(); break; 
		case "settings": 
			$_SESSION['play_sounds'] = $post['play_sounds']; 
			$return = ['res'=> $_SESSION['play_sounds'], 'data'=>$post];
			break; 
	}

	switch( ACTION ){
		case "add": $return = $CLASS->add( $data ); break; 
		case "edit": $return = $CLASS->edit( $data ); break; 
		case "load": $return = $CLASS->load( $data ); break; 
		case "get": $return = $CLASS->get( $data ); break;  
		// users 
		case "auth": $return = $CLASS->auth( $data ); break;
		case "reg": $return = $CLASS->reg( $data ); break; 
		case "balance": $return = $CLASS->balance( $data ); break; 
		// cf
		case "next": $return = $CLASS->next( $data ); break;
		case "bulk": $return = $CLASS->bulk( $data ); break;  
		case "current": $return = $CLASS->current( $data ); break;  
		// games  
		case "search": $return = $CLASS->search( $data ); break; 
		case "history": $return = $CLASS->history( $data ); break; 
		case "close": $return = $CLASS->close( $data ); break; 
		// currency conversion methods
		case "save_game_result": $return = $CLASS->save_game_result( $data ); break;
		case "get_user_balance": $return = $CLASS->get_user_balance( $data ); break;
		case "update_balance": $return = $CLASS->updateBalance( $data ); break; 

	}

	echo json_encode( $return );
	exit(); 



