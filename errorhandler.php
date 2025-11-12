<?php
//
//-------------------------------------------------------------------------
    function fatal_error_handler(){ 
        $error = error_get_last();
        if( ( $error && is_array( $error ) && ( $error['type'] === E_ERROR ) || ( $error['type'] === E_USER_ERROR ) ) ){
            $output = ob_get_clean(); 
            //header( 'HTTP/1.1 503 Service Unavailable' );
            //echo '<div style="position:fixed; top:50%; left:0; right:0; z-index:999; background:#fff; padding:25px; margin:-50px 0px 0px 0px; text-align:center; color:#000;">
            //        <h1>Произошла внутренняя ошибка!</h1><p>Наши специалисты уже знают об этой проблеме и работают над ее устранением.</p>
            //   </div>';
            $debug = var_export( $error, true ) . PHP_EOL;
            $debug .= "\n\n";
            $debug .= "From hostname: " . $_SERVER['SERVER_NAME'];
            $debug .= "\n\n_GET:" . var_export($_GET, true);
            $debug .= "\n\n_POST:" . var_export($_POST, true);
            $debug .= "\n\n_SERVER:" . var_export($_SERVER, true); 
            
            @App::telega( $debug );
        }
    }
 //
 //-------------------------------------------------------------------------   
    function exception_handler( $exception ){ 
        Logger::exception( $exception );
    }
//
//-------------------------------------------------------------------------
    function error_handler( $code, $message, $file, $line ){ 
        $level = '';
        switch( $code ){
            case E_WARNING:
            case E_USER_WARNING: $level = Logger::LOG_WARNING; break;
            case E_ERROR:
            case E_USER_ERROR: $level = HTS_Logger::LOG_ERROR; break;
            case E_USER_NOTICE:
            case E_NOTICE:  // $level = HTS_Logger::LOG_NOTICE; break;
            case E_STRICT:  // TODO we cannot handle E_STRICT at the moment, Logger issues
                break;
            default: $level = HTS_Logger::LOG_ERROR; break;
        }
        if( error_reporting() !== 0 ){
            $trace = array_reverse( debug_backtrace() );
            $str_trace = '';
            foreach( $trace as $call ){
                if( $call['function'] == 'error_handler' ){ continue; }
                $args = array();
                if( isset( $call['args'] ) && is_array( $call['args'] ) ){
                    foreach( $call['args'] as $arg ){ $args[] = is_scalar($arg) ? $arg : ( is_object($arg) ? get_class($arg) : gettype($arg) ); }
                }
                $args = implode(', ',$args);
                if( isset($call['class']) && $call['class'] ){ $call['class'] .= $call['type']; } 
                else { $call['class'] = ''; }
                if( !isset($call['line']) ){ $call['line'] = '<none>'; }
                if( !isset($call['function']) ){ $call['function'] = '<none>'; }
                $str_trace .= @$call['file'] .':'. $call['line'] .' '. $call['class']. $call['function'] .'('. $args.')'."\n";
            }
            Logger::error( $file, $line, $message, $level, $str_trace );
        }
    }
//
//-------------------------------------------------------------------------
    //register_shutdown_function('fatal_error_handler');
    //set_exception_handler('exception_handler');
    //set_error_handler('error_handler');
//
//-------------------------------------------------------------------------


