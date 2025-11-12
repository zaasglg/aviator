<?php
    include_once(CLASS_DIR . 'DMTcaptcha.class.php');
    $captcha = new DMTcaptcha();
    $_SESSION['captcha_keystring'] = $captcha->getKeyString(); 
    exit(); 

    