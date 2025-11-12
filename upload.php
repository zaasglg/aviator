<?php 
	ini_set("file_uploads", 1);
	ini_set("upload_tmp_dir", "/tmp");
	ini_set("upload_max_filesize", "3M");
	ini_set("post_max_size", "70M");
	ini_set("max_file_uploads", 3);

	$post = $_REQUEST; 
	$ret = array();
	$type = isset( $_REQUEST['type'] ) ? substr( preg_replace( '/[^A-Z]/', '', $_REQUEST['type'] ), 0, 16 ) : ""; 
	$obj = isset( $_REQUEST['obj'] ) ? App::uid( $_REQUEST['obj'] ) : ""; 

	$max_size = 5;
	$types = array('png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'); 

	if( isset( $_FILES['file'] ) ){
		if ( $_FILES['file']['error'] > 0 ) {
			$ret = array( 'error'=>1, 'msg'=>$_FILES['file']['error'] ); 
		} 
		else { 
			$name = $_FILES['file']['name'];
			$res = explode(".", $name);
			$res = count( $res ) ? $res[ count($res)-1 ] : "jpg"; 
			$id = md5( $name ."::". time() ); 
			$size = $_FILES['file']['size'];
			$file_name = $id .".". $res; 
			//$name = explode(".", $name);
			//unset( $name[ count($name)-1] );//$name = array_slice( $name, 0, count($name) - 1 ); 
			//$name = implode(".", $name );
			
			if( !in_array( strtolower($res), $types ) ){ 
				$ret = array( 'error'=>2, 'msg'=>"Расширение ". $res ." не поддерживается" );
			} 
			else if( ( $size / 1024 /1024 ) > $max_size ){
				$ret = array( 'error'=>3, 'msg'=>"Размер файла превышает ". $max_size ."Мб" );
			}
			else { 
				$ret = array(
					'success'=> $id, 
					'id'=> $id, 
					'ext'=> $res, 
					'size'=> $size, 
					'type'=> $type, 
					'data'=> "", 
					'link'=> $obj, 
					'cover'=>'' //md5( $id )
				); 
				move_uploaded_file( $_FILES['file']['tmp_name'],  UPLOADS_DIR . $file_name ); 
				$file = UPLOADS_DIR . $file_name; 
				if( is_file( $file ) ){ 
					$tmp_file = UPLOADS_DIR . md5( time() ); 
					list( $width, $height, $type ) = getimagesize( $file ); 
					//if( in_array( $ret['ext'], array('jpg', 'JPG', 'jpeg', 'JPEG') ) ){ 
					if( $type == IMAGETYPE_JPEG ){
						$tmp_file = imagecreatefromjpeg( $file ); 
					} 
					//if( in_array( $ret['ext'], array('png', 'PNG') ) ){ 
					if( $type == IMAGETYPE_PNG ){ 
						$tmp_file = imagecreatefrompng( $file ); 
					}	
					else {
						$tmp_file = imagecreatefromjpeg( $file ); 
					}
					$scale = 200; 
					switch( $type ){ 
						case "USER": 
						case "PRODUCT": 
						case "PRODUCTIMAGE": 
						case "MARKET": 
						case "MARKETIMAGE": 
							$scale = 200;
							break; 
						case "ORDER": 
						case "ORDERIMAGE": 
						case "DELIVERY": 
						case "MESSAGE": 
						case "ADDRESS": 
						case "SYSTEM": 
							$scale = 300; 
							break; 
						case  "BANNER": 
						case "BANNERM": 
							$scale = 900; 
							break; 
					}
					if( $width > $scale || $height > $scale ){ 
						if( $width > $height ){
							$scale = 1 / ( $height / $scale ); 
						} 
						else { 
							$scale = 1 / ( $width / $scale ); 
						} 
						$new_width = $width * $scale;
						$new_height = $height * $scale; 
						$image_p = imagecreatetruecolor( $new_width, $new_height );
						imagecopyresampled( $image_p, $tmp_file, 0, 0, 0, 0, $new_width, $new_height, $width, $height ); 
						//if( $type == IMAGETYPE_JPEG ){
						//	imagejpeg( $image_p, $file, 100 ); 
						//}
						if( $type == IMAGETYPE_PNG ){
							imagepng( $image_p, $file, 9 );
						} 
						else {
							imagejpeg( $image_p, $file, 100 ); 
						}
						imagedestroy( $tmp_file );
					}

					$fp = @fopen($file, "r"); 
					if( $fp ){ 
						$contents = @fread( $fp, filesize($file) ); 
						$ret['data'] = base64_encode($contents); 
						@fclose($fp); 
					} 
				} 
				else {
					$ret['error'] = "file ". $file ." not found";
				}
				$save = array(
					'node'=> NODE, 
					'uid'=> UID, 
					'link'=> $obj, 
					'type'=> $ret['type'], 
					'file'=> $file_name, 
					'status'=> "1" 
				);
				$ret['id'] = MySQL::ins( TABLE_PICTURES, $save ); 
				$ret['cover'] = md5( $ret['id'] );
			}
		} 
	}
	else {
		$ret = array( 'error'=>4, 'msg'=>"array is empty", 'data'=>$_REQUEST );
	}
	echo json_encode( $ret );
	exit();





	