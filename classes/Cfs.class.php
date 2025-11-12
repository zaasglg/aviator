<?php
	class Cfs extends Singleton {         
        protected $dbo; 
        public static $table = TABLE_CF; 
        protected $id; 
        protected $amount; 
        protected $status;  
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
        public function bulk( $d=[] ){
            return ['error'=>1, 'msg'=>"Database connection removed"];
        }
//
//===================================================== 
        public function add( $d=[] ){
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
        public function load( $d=[] ){ 
            return []; 
		}
//
//===================================================== 
        public function next( $d=[] ){
            return null; 
        }
//
//===================================================== 
        public function _current( $d=[] ){ 
            return []; 
        }
//
//=====================================================  
		public function current( $d=[] ){ 
            return []; 
        }
//
//=====================================================
	} 
