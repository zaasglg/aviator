<?php
	class Bets extends Singleton {         
        protected $dbo; 
        public static $table = TABLE_BETS; 
        protected $id; 
        protected $user; 
        protected $sid; 
        protected $bet; 
        protected $cf; 
        protected $result; 
        protected $game; 
        protected $type; 
        protected $src; 
        protected $status; 
//
//=====================================================
        protected function __construct(){
            // Database connection removed
        }
//
//===================================================== 
        public static function getInstance( $c=null, $name="", $params=[] ){
            return parent::getInstance(__CLASS__);
        } 
//
//===================================================== 
        public function add( $d=[] ){
            return ['error'=>1, 'msg'=>"Database connection removed"];
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
        public function get( $d=[] ){ 
            return null;  
        }
//
//===================================================== 
        public function load( $d=[] ){ 
            return []; 
		}
//
//===================================================== 
        public function generic( $d=[] ){
            return null;
        }        
//
//===================================================== 
	} 
