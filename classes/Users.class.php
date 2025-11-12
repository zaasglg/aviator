<?php
	class Users extends Singleton {  
		protected $dbo; 
		public static $table = TABLE_USERS; 
		protected $id; 
		protected $uid; 
		protected $host_id; 
		protected $name; 
		protected $real_name;
		protected $img; 
		protected $balance; 
		protected $status; 
		protected $date; 
		protected $basic_balance; 
//	
//===================================
		public function __construct( $d=[] ){
			// Database connection removed
			$this->basic_balance = 500; 
		}
//		
//-----------------------------------------------------
		public static function getInstance( $c=null, $name="", $params=[] ){
            return parent::getInstance( $c ? $c : __CLASS__ );
        }
//
//===================================
        public function exists( $d=[] ){
            return false;
        }
//
//===================================
		public static function logout(){
			foreach( $_SESSION as $k=>$v ){ unset( $_SESSION[ $k ] ); }
			$_SESSION = [];
			header('Location: /');
			exit();
		}
//
//===================================
		public function add( $d=[] ){
			return ['error'=>1, 'msg'=>"Database connection removed"]; 
		}
//
//===================================
		public function get( $d=[] ){ 
			return null; 
		}
//
//===================================
		public function edit( $d=[] ){ 
			return ['error'=>1, 'msg'=>"Database connection removed"]; 
		}
//
//=================================== 
		public function load( $d=[] ){
			return [];
		}
//
//=================================== 
		public function active( $d=[] ){
			return [];
		}
//
//=================================== 
		public function charge( $d=[] ){
			return false;
		}
//
//=================================== 
		public function balance( $d=[] ){ 
			error_log("Users::balance called - UID: " . UID . ", AUTH: " . AUTH);
			if( !AUTH && isset( $_SESSION['aviator_demo'] ) ){
				$balance = $_SESSION['aviator_demo']; 
				error_log("Demo mode - balance: " . $balance);
			}
			else {
				$balance = isset($_SESSION['user']['balance']) ? $_SESSION['user']['balance'] : 500;
				error_log("Session balance: " . $balance);
			}
			error_log("Final balance returned: " . $balance);
			return $balance; 
		}
//
//=================================== 
	}
