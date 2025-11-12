<?php
	class Games extends Singleton {         
        protected $dbo; 
        public static $table = TABLE_GAMES; 
        protected $id; 
        protected $cf; 
        protected $status; 
        protected $finish;  
//
//=====================================================
        protected function __construct(){
            // Database connection removed
        }
//
//===================================================== 
        public static function getInstance( $c=null, $name="", $params=array() ){
            return parent::getInstance(__CLASS__);
        } 
//
//===================================================== 
        public function search( $d=[] ){
            return null; 
        }
//
//===================================================== 
        public function add( $d=[] ){
            return null; 
        }
//
//===================================================== 
        public function close( $d=[] ){
            return ['error'=>1, 'msg'=>"Database connection removed"];
        }
//
//===================================================== 
        public function edit( $d=[] ){ 
            return ['error'=>1, 'msg'=>"Database connection removed"]; 
        }
//
//===================================================== 
        public function get( $d= [] ){ 
            return null; 
        }
//
//===================================================== 
        public function load( $d=array() ){ 
            return []; 
		}
//
//=====================================================
		public function history( $d=[] ){
            return []; 
        }
//
//===================================================== 
	} 
