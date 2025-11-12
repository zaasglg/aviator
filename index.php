<?php 
	// Простая проверка работы PHP
	$debug_file = dirname(__FILE__) . '/debug.log';
	file_put_contents($debug_file, date('Y-m-d H:i:s') . " - Aviator index.php started\n", FILE_APPEND);
	file_put_contents($debug_file, date('Y-m-d H:i:s') . " - GET params: " . json_encode($_GET) . "\n", FILE_APPEND);
	file_put_contents($debug_file, date('Y-m-d H:i:s') . " - REQUEST params: " . json_encode($_REQUEST) . "\n", FILE_APPEND);
	
	if( !defined('BASE_DIR') ){ 
		define('BASE_DIR', dirname(__FILE__)."/"); 
	}
	include_once BASE_DIR ."init.php"; 
	//include_once BASE_DIR ."common.php"; 
	include_once BASE_DIR ."router.php"; 
	include_once BASE_DIR ."localization.php";
	
	if( ISAPI ){ 
		include_once BASE_DIR ."api.php";
		exit();
	} 

	if( !defined('TPL') ){ define('TPL', "404"); } 
	if( !defined('PAGETITLE') ){ define('PAGETITLE', BASE_TITLE ); } 
	if( !defined('PAGEKEYWORDS') ){ define('PAGEKEYWORDS', ""); } 
	if( !defined('PAGEDESCRIPTION') ){ define('PAGEDESCRIPTION', ""); } 
	if( !defined('PAGEAUTHOR') ){ define('PAGEAUTHOR', "LCST"); }
	if( !defined('VISUALISATION') ){ define('VISUALISATION', true ); }
	if( !defined('ADMIN') ){ define( ADMIN, false ); } 

	$head = TPL_DIR ."head". TPL_EXT; 
	if( is_file( $head ) ){ 
		include_once $head; 
	}
?>
<body 
	data-controller="<?= CONTROLLER; ?>" 
	data-action="<?= ACTION; ?>" 
	data-tpl="<?= TPL; ?>" 
	data-currency="<?= CURRENCY; ?>" 
	data-sound="<?= isset( $_SESSION['play_sounds'] ) ? $_SESSION['play_sounds'] : 1; ?>">
	<?php 
		$tpl = TPL_DIR . TPL . TPL_EXT;
		if( is_file( $tpl ) ){ include_once $tpl; } 
	?> 
	<div style="display:none;"><?= json_encode($_SESSION) ; ?></div>
</body>
</html>
