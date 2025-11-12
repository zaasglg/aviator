var SETTINGS = {
    w: document.querySelector('#game_field').offsetWidth, //$('#canvas').width(), 
    h: document.querySelector('#game_field').offsetHeight, //$('#canvas').height(), 
    start: {
        x: 20, 
        y: 400  // Fixed position instead of dynamic calculation
    }, 
    timers: { 
        loading: 15000, 
        flight: 300000, 
        finish: 10000 
    }, 
    volume: {
        active: +$('body').attr('data-sound'), 
        music: 0.2, 
        sound: 0.9
    }, 
    currency: $('body').attr('data-currency') ? $('body').attr('data-currency')  : "USD" 
}

function trunc2(val) {
    var n = Number(val);
    if (isNaN(n)) return '0.00';
    return (Math.floor(n * 100) / 100).toFixed(2);
}
function setBalanceDisplay(val) {
    var disp = trunc2(val);
    $('[data-rel="balance"]').each(function(){
        $(this).val(disp).html(disp).text(disp);
    });
    $('#main_balance').html(disp);
}

var $canvas = document.querySelector("#canvas");
var $ctx = $canvas.getContext("2d");
$canvas.width = SETTINGS.w; 
$canvas.height = SETTINGS.h;

console.log("Canvas initialized:", {
    width: $canvas.width,
    height: $canvas.height,
    settingsW: SETTINGS.w,
    settingsH: SETTINGS.h
}); 

var SOUNDS = {
    music: new Howl({
        src: ['res/sfx/bg_music.mp3'], 
        //autoplay: true, 
        preload: true, 
        html5: true, 
        loop: true, 
        volume: SETTINGS.volume.music 
    }), 
    sounds: new Howl({
        src: ['res/sfx/sprite_audio.mp3'], 
        "sprite": {
            "away": [
                1700,
                3000
            ],
            "start": [
                6500,
                1000
            ],
            "win": [
                9000,
                1000
            ]
        }, 
        preload: true, 
        html5: true, 
        loop: false, 
        volume: SETTINGS.volume.sound
    })
}

var IMAGES = "res/img/"; 
var $plane_image = [ 
    new Image(), 
    new Image(),
    new Image(),
    new Image() 
];
$plane_image[0].src = IMAGES+'plane-0.png'; 
$plane_image[1].src = IMAGES+'plane-1.png'; 
$plane_image[2].src = IMAGES+'plane-2.png'; 
$plane_image[3].src = IMAGES+'plane-3.png'; 

class Helpers {
    constructor( obj ){ } 
    distance( A, B ){
        var $distance = Math.sqrt( Math.pow( A.x - B.x, 2 ) + Math.pow( A.y - B.y, 2 ) ); 
        return $distance; 
    }
    len( $v ){
        return Math.sqrt( $v.x * $v.x + $v.y * $v.y + 0 );
    } 
    normalize( $v ){ 
        var $len = this.len( $v );
        var $res = { x: ( $v.x / $len ), y: ( $v.y / $len ), z:0 }
        return $res;
    } 
}

var HELPERS = new Helpers({}); 

class Sprite {
    constructor( obj ){
        this.timer = new Date().getTime();
        this.current = 0; 
        this.ctx = obj.ctx;
        this.images = obj.images;
        this.width = obj.width;
        this.height = obj.height; 
        this.speed = obj.speed; 
    } 
    update( obj ){
        var $timer = new Date().getTime(); 
        var $delta = $timer - this.timer; 
        if( $delta >= this.speed ){
            this.current += 1; 
            if( this.current == this.images.length ){ this.current = 0; }
            this.timer = $timer; 
        }
        this.draw( obj ); 
    }
    draw( obj ){
        this.ctx.drawImage(
            this.images[ this.current ],
            obj.x,
            obj.y,
            this.width,
            this.height 
        );
    }
} 

class Chart {
    constructor( obj ){ 
        this.ctx = obj.ctx; 
        this.sx = obj.sx;       // start.x
        this.sy = obj.sy;       // start.y
        this.ax = obj.ax;       // arc.x
        this.ay = obj.ay;       // arc.y 
        this.fx = obj.fx;       // finish.x
        this.fy = obj.fy;       // finish.y
        this.fill = obj.fill ? obj.fill : 'rgba(255, 0, 0, 0.1)'; 
        this.stroke = obj.stroke ? obj.stroke : "red"; 
        this.w = obj.w ? obj.w : 5; 
        this.line = obj.line ? obj.line : 1; 
    }
    update( obj ){
        this.fx = obj.x; 
        this.fy = obj.y; 
        this.ax = ( this.fx - this.sx ) / 2; 
        this.ay = ( SETTINGS.h - 20 ); 
        this.draw();
    }
    draw(){
        // fill
        this.ctx.beginPath();
        this.ctx.moveTo( this.sx, this.sy );
        this.ctx.quadraticCurveTo( this.ax, this.ay, this.fx, this.fy ); 
        this.ctx.lineTo( this.fx, this.sy ); 
        this.ctx.closePath(); 
        this.ctx.fillStyle = this.fill;
        this.ctx.fill();
        // arc
        this.ctx.beginPath();
        this.ctx.moveTo( this.sx, this.sy );
        this.ctx.quadraticCurveTo( this.ax, this.ay, this.fx, this.fy );
        this.ctx.strokeStyle = this.stroke;
        this.ctx.lineWidth = this.w;
        this.ctx.stroke();
        // triangle
        this.ctx.beginPath();
        this.ctx.moveTo( this.fx, this.fy );
        this.ctx.lineTo( this.fx, this.sy );
        this.ctx.lineTo( this.sx, this.sy );
        this.ctx.strokeStyle = this.stroke;
        this.ctx.lineWidth = this.line;
        this.ctx.stroke(); 
    }
}

class Plane {
    constructor( obj ){ 
        this.ctx = obj.ctx; 
        this.x = obj.x; 
        this.y = obj.y; 
        this.w = obj.w; 
        this.h = obj.h; 
        this.sx = obj.sx ? obj.sx : -Math.round( this.w * 0.05 );  
        this.sy = obj.sy ? obj.sy : -Math.round( this.w * 0.45 ); 
        this.img = new Sprite({
            ctx: $ctx,
            images: $plane_image,
            width: this.w,
            height: this.h, 
            speed: 150  // Increased from 100 to 150 for slower sprite animation
        });  
        this.chart = obj.chart; 
        this.vel = 1.5;  // Reduced from 3 to 1.5
        this.status = "idle"; 
        this.route = [
            { x:SETTINGS.w-( SETTINGS.w*0.20 ), y:SETTINGS.h*0.5 }, 
            { x:SETTINGS.w-( SETTINGS.w*0.23 ), y:SETTINGS.h*0.45 }, 
            { x:SETTINGS.w-( SETTINGS.w*0.20 ), y:SETTINGS.h*0.5 }, 
            { x:SETTINGS.w-( SETTINGS.w*0.18 ), y:SETTINGS.h*0.55 }, 
            { x:SETTINGS.w-( SETTINGS.w*0.20 ), y:SETTINGS.h*0.5 }, 
            { x:( SETTINGS.w*100 ), y:SETTINGS.h*0.5 }
        ];
        this.pos = 0; 
        this.trace = obj.trace ? obj.trace : true;
    } 
    move( $dir, $speed ){ 
        var $vector = { x: ( $dir.x - this.x ), y: ( $dir.y - this.y ), z: 0 }
        let V = HELPERS.normalize( $vector ); 
        this.x += V.x * $speed; 
        this.y += V.y * $speed; 
    }
    update( obj ){ 
        if( this.status == "move" ){
            if( HELPERS.distance( { x:this.x, y:this.y }, { x:this.route[ this.pos ].x, y:this.route[ this.pos ].y } ) > 5 ){
                this.move({ x:this.route[ this.pos ].x, y:this.route[ this.pos ].y }, ( !this.pos ? this.vel : ( this.pos > 4 ? this.vel*3 : 0.8 ) ) );  // Reduced multiplier from 10 to 3, and slow speed from 1 to 0.8
            }  
            else {
                this.pos += 1; 
                if( this.pos >= this.route.length ){ 
                    this.pos = 0; 
                    //this.status = "idle"; 
                } 
                if( this.pos > 4 ){ this.pos = 1; }
            }
        } 
        if( this.trace ){ 
            this.chart.update({ x:this.x, y:this.y }); 
        }
        this.img.update({ x:this.x+this.sx, y:this.y+this.sy }); 
        if( this.trace && 2 == 3 ){ 
            this.ctx.closePath();
            this.ctx.beginPath(); 
            this.ctx.lineWidth = 1; 
            this.ctx.strokeStyle = "blue"; 
            this.ctx.fillStyle = "blue"; 
            this.ctx.arc( this.x, this.y, 5, 0*(3.14/180), 360*(3.14/180), false ); 
            this.ctx.fill(); 
            this.ctx.stroke(); 
            this.ctx.closePath(); 
        }
    }
} 

class Game {
    constructor( obj ){ 
        this.user_bets = [0,0];  
        this.autoplay = [{},{}]; 
        this.current_bets = []; 
        this.max_bet = 500; 
        this.generic_chanse = 99.2;
        this.factor = 11; 
        this.timer = new Date().getTime(); 
        this.timers = SETTINGS.timers; 
        this.status = "loading"; 
        this.cur_cf = 1.0; 
        this.win_cf = 2.56; 
        this.new_delta = 0; 
        var $vics = document.querySelectorAll('[data-rel="currency"]'); 
        if( $vics && $vics.length ){
            for( var $vic of $vics ){
                $vic.innerHTML = SETTINGS.currency;
                $vic.value = SETTINGS.currency;
            }
        }
        //$('[data-rel="currency"]').html( SETTINGS.currency ).val( SETTINGS.currency );
        this.game_create({}); 
        this.get_history(); 
        this.get_bets({ user:$user.uid, sort:'id', dir:'desc' });
        this.bind(); 
        document.querySelector('#loading_level').style.display = 'flex'; 
        document.querySelector('#process_level').style.display = 'none';
        document.querySelector('#complete_level').style.display = 'none';
        //$('#loading_level').css('display','flex'); 
        //$('#process_level').css('display', 'none');
        //$('#complete_level').css('display', 'none');
        render();
    }
    bind(){
        console.log("bind() function started");
        console.log("Found", $('#actions_wrapper .make_bet').length, "make_bet buttons");
        
        // Reset all buttons to initial state
        $('.make_bet').each(function(){
            var $btn = $(this);
            $btn.removeClass('danger').removeClass('warning').attr('data-id', 0);
            $('span', $btn).html(LOCALIZATION.make_bet_generic_bet);
            $('h2', $btn).css('display','flex'); 
            $('h3', $btn).hide();
            console.log("Button", $btn.attr('data-src'), "reset to bet mode");
        });
        // звук 
        $('#sound_switcher').off().on('click', function(){
            if( SETTINGS.volume.active ){
                SETTINGS.volume.active = 0; 
                $('#sound_switcher').addClass('off');
                SOUNDS.music.stop(); 
            }
            else {
                SETTINGS.volume.active = 1; 
                $('#sound_switcher').removeClass('off');
                SOUNDS.music.play(); 
            } 
            $('body').attr('data-sound', SETTINGS.volume.active);
            $.ajax({
                url:"index.php?route=api/settings", type:"json", method:"post", data:{ play_sounds: SETTINGS.volume.active }
            });
        });
        // модалка для победы
        $('#modal_wrapper .close').off().on('click', function(){
            $('#modal_wrapper').removeClass('active');
        });
        // модалка автоигры 
        $('.footer .autoplay').off().on('click', function(){ 
            $('#autoplay_modal').css('display', 'flex').attr('data-id', $(this).data('id')); 
        });
        $('#autoplay_modal').off().on('click', function(){
            //$('#autoplay_modal').hide(); 
        });
        $('#autoplay_modal .close').off().on('click', function(){
            $('#autoplay_modal').hide(); 
        });
        $('.modal .modal-content').off().on('click', function(e){
            //e.preventDefault(); 
            //e.stopPropagation(); 
            //$('#autoplay_modal').css('display','flex');
        });
        $('#reset_autoplay').off().on('click', function(){
            $('#autoplay_modal .ranger input[type="text"]').val(0);
            $('#autoplay_modal .switchers input[type="checkbox"]').prop('checked', false);
            $('#autoplay_modal .rounds-wrap label input[type="radio"]').prop('checked', false)
        });
        $('#save_autoplay').off().on('click', function(){
            var $id = +$('#autoplay_modal').attr('data-id');
            var $data = {
                id: $id, 
                bet: 0, 
                rounds: +$('#autoplay_modal [name="numrounds"]:checked').val(), 
                numrounds: 0, 
                isisdecrease: $('#autoplay_modal [name="isdecreases"]').is(':checked'), 
                decrease: +$('#autoplay_modal [name="decreases"]').val(), 
                isincrease: $('#autoplay_modal [name="isincreases"]').is(':checked'), 
                increase: +$('#autoplay_modal [name="increases"]').val(), 
                iswins: $('#autoplay_modal [name="iswins"]').is(':checked'), 
                wins: +$('#autoplay_modal [name="wins"]').val(), 
                numwins: 0 
                //iscashout: $('[name="cashout_switcher"][data-id="'+$id+'"]').is(':checked'), 
                //cashout: +$('[name="cashout_value"][data-id="'+$id+'"]').val() 
            } 
            console.log("AutoPlay :", $data); 
            $game.autoplay[($id-1)] = $data; 
            $('#autoplay_modal').hide(); 
            //$('.actions_field[data-id="'+$id+'"] .footer').addClass('active'); 
            $('.make_bet[data-src="'+$id+'"]').attr('disabled','disabled');
            $('.actions_field[data-id="'+$id+'"] .autoplay').html( LOCALIZATION.autobet_generic_stop + " ("+ $data.rounds +")").addClass('active').off().on('click', function(){
                var $self=$(this); 
                var $id=$self.data('id'); 
                $game.autostop({ id: $id });
            });
            // clear modal 
            $('#autoplay_modal .ranger input[type="text"]').val(0);
            $('#autoplay_modal .switchers input[type="checkbox"]').prop('checked', false);
            $('#autoplay_modal .rounds-wrap label input[type="radio"]').prop('checked', false)
        });
        // кнопки в менюхах
        $('.base_menu li').off().on('click', function(){
            var $self=$(this); 
            var $wrap=$self.parent(); 
            $('li', $wrap).removeClass('active'); 
            $self.addClass('active');
            var $auto_id = +$self.attr('data-id');
            if( $auto_id ){ $game.autostop({id:$auto_id}); }
        }); 
        // кнопки +- 
        $('.ranger button').off().on('click', function() {
            var $self=$(this); 
            var $dir=$self.data('dir'); 
            var $wrap=$self.parent();
            var $input = $('input:text', $wrap);
            var $val = +$input.val(); 
            var $res = $dir == "plus" ? ($val + 0.5) : ($val - 0.5); 
            $res = $res < 0.5 ? 0.5 : ( $res > 100 ? 100 : $res ); 
            $input.val($res); 
        }); 
        // изменение ставки кнопками +- 
        $('#actions_wrapper .actions_field .ranger button').off().on('click', function(){
            var $self=$(this); 
            var $dir=$self.data('dir'); 
            var $wrap=$self.parent();
            var $card=$wrap.parent().parent(); 
            var $input = $('input:text', $wrap);
            var $val = +$input.val(); 
            var $res = $dir == "plus" ? ($val + 0.5) : ($val - 0.5); 
            $res = $res < 0.5 ? 0.5 : ( $res > 100 ? 100 : $res ); 
            $input.val($res);
            $('[data-rel="current_bet"]', $card).val( $res ).html( $res );
        }); 
        // изменение ставки вводом
        $('#actions_wrapper .actions_field .ranger input').off().on('keyup', function(){
            var $self=$(this); 
            var $wrap=$self.parent();
            var $card=$wrap.parent().parent().parent(); 
            var $val = +$self.val(); 
            $val = $val < 0.5 ? 0.5 : ( $val > $game.max_bet ? $game.max_bet : $val ); 
            $self.val( $val ); 
            $('[data-rel="current_bet"]', $card).val( $val ).html( $val );
        }); 
        // изменение ставки кнопками с ценой
        $('#actions_wrapper .actions_field .fast_bet').off().on('click', function(){
            var $self=$(this); 
            var $wrap=$self.parent().parent().parent(); 
            var $val = parseFloat( $self.text() ); 
            var $cur = parseFloat( $('input:text', $wrap).val() ); 
            //if( $cur < $val || $cur % $val ){ $val = $val; } 
            //else { $val = $cur + $val; } 
            if( $self.attr('active') ){ $val = $cur + $val; } 
            $('.fast_bet').removeAttr('active');
            $self.attr('active', 1); 
            $val = $val < 0.5 ? 0.5 : ( $val > $game.max_bet ? $game.max_bet : $val ); 
            $('input:text', $wrap).val( $val );
            $('[data-rel="current_bet"]', $wrap).val( $val ).html( $val );
        }); 
        // включение автовывода
        $('#actions_wrapper .actions_field .auto_out_switcher input').off().on('change', function(){
            var $self=$(this); 
            var $checked = $self.is(':checked'); 
            var $wrap=$self.parent().parent();
            var $input = $('input:text', $wrap); 
        });
        // сделать ставку 
        console.log("Setting up make_bet click handlers");
        $('#actions_wrapper .make_bet').off().on('click', function(){
            console.log("make_bet click handler triggered");
            var $self=$(this); 
            var $id = parseInt( $self.attr('data-id') ); 
            var $src = parseInt( $self.attr('data-src') ); 
            var $wrap = $self.parent().parent(); 
            var $bet = parseFloat( $('input:text', $wrap).val() );
            var $current_balance = parseFloat( $('[data-rel="balance"]').text() || $('[data-rel="balance"]').val() || 0 );
            console.log("Button clicked - ID:", $id, "SRC:", $src, "BET:", $bet, "Status:", $game.status, "Current Balance:", $current_balance); 
            switch( $game.status ){
                case "flight": 
                    if( $id ){ 
                        $('span', $self).html(LOCALIZATION.make_bet_generic_bet); 
                        $self.removeClass('danger').removeClass('warning');
                        $('h3', $self).hide(); 
                        $('h2', $self).css('display','flex'); 
                        $game.bet_complete({ id:$id, cf:parseFloat( $game.cur_cf ), type:'manual', src:$src }); 
                        $game.modal({ cf:parseFloat( $game.cur_cf ), result:( $bet * parseFloat( $game.cur_cf ) ), bet:$bet });
                        $self.attr('data-id', 0);
                    } 
                    else {
                        // Размещаем ставку на следующий раунд
                        console.log("Placing bet for next round - Button", $src, "Bet:", $bet);
                        $game.user_bets[ $src-1 ] = $bet; 
                        $game.bet_add({ type:"manual", src:$src, bet:$bet });
                        $self.removeClass('warning').removeClass('danger'); 
                        $('span', $self ).html(LOCALIZATION.make_bet_generic_bet);
                        $('h2', $self).css('display','flex'); 
                        $('h3', $self).css('display','flex'); // Показываем "Следующий раунд"
                        $('.actions_field[data-id="'+$src+'"]').addClass('disabled'); 
                        $('.actions_field[data-id="'+$src+'"] .fast_bet').attr('disabled', "disabled"); 
                        $('.actions_field[data-id="'+$src+'"] .autoplay').attr('disabled','disabled');
                    }
                    break; 
                case "finish": 
                    break; 
                case "loading": 
                    if( $id ){ 
                        $game.bet_edit({ id:$id, src:$src, status:5 });
                        $self.removeClass('danger').removeClass('warning'); 
                        $game.user_bets[ $src-1 ] = 0; 
                        $self.attr('data-id', 0);
                        $('span', $self ).html(LOCALIZATION.make_bet_generic_bet);
                        $('h2', $self).css('display','flex'); 
                        $('h3', $self).hide();  
                        $('.actions_field[data-id="'+$src+'"]').removeClass('disabled'); 
                        $('.actions_field[data-id="'+$src+'"] .fast_bet').attr('disabled', "disabled"); 
                        $('.actions_field[data-id="'+$src+'"] .autoplay').attr('disabled','disabled');
                    }
                    else { 
                        console.log("Placing bet in loading state - Button", $src, "Bet:", $bet);
                        $game.user_bets[ $src-1 ] = $bet; 
                        $game.bet_add({ type:"manual", src:$src, bet:$bet });
                        $self.addClass('danger').removeClass('warning'); 
                        $('span', $self ).html(LOCALIZATION.make_bet_generic_cancel);
                        $('h2', $self).css('display','flex'); 
                        $('h3', $self).hide(); 
                        $('.actions_field[data-id="'+$src+'"]').addClass('disabled'); 
                        $('.actions_field[data-id="'+$src+'"] .fast_bet').attr('disabled', "disabled"); 
                        $('.actions_field[data-id="'+$src+'"] .autoplay').attr('disabled','disabled');
                        console.log("Bet placed, button data-id will be set by bet_add response");
                    }
                    break;
            }
        }); 
    }
    update( obj ){
        var $timer = new Date().getTime(); 
        var $delta = $timer - this.timer;// + this.new_delta; 
        var $change = false; 
        //console.log( $delta );
        if( $delta >= SETTINGS.timers[ this.status ] ){
            $change = true; 
            this.timer = $timer; 
            this.new_delta = 0;
        }
        switch( this.status ){
            case "loading": 
                if( $change ){ 
                    //this.loading_to_flying({ cf:this.win_cf, delta:SETTINGS.timers.flight });
                } 
                else { 
                    var $freq = +$('#loading_level .progresser').data('freq'); 
                    $freq = $freq - ( $delta / ( +SETTINGS.timers.loading / 100 ) );
                    $freq = $freq < 1 ? 1 : $freq; 
                    $('#loading_level .progresser').css('width', $freq+"%").attr('data-freq',$freq); 
                    this.bet_generic();
                }
                break;
            case "flight":
                if( this.cur_cf >= this.win_cf ){ 
                    this.flying_to_finish({ cf:this.win_cf, delta:SETTINGS.timers.flight }); 
                    // BUTTONS - remove this global update that affects all buttons
                    // $('.make_bet span').html(LOCALIZATION.make_bet_generic_cancel); 
                    // $('.make_bet h3').css('display','flex'); 
                    // $('.make_bet h2').hide(); 
                    // $('.make_bet').addClass('danger').removeClass('warning').attr('data-id', 0); 
                } 
                else { 
                    this.cur_cf = 1 + 0.5 * ( Math.exp( ( $delta / 1000 )  / 5 ) - 1 );
                    if( this.cur_cf >= 2 ){ $('#process_level .current').attr('data-amount',2); }  
                    if( this.cur_cf >= 4 ){ $('#process_level .current').attr('data-amount',3); }
                    $('#process_level .current').html( this.cur_cf.toFixed(2)+"x"); 
                    this.autocheck(); 
                    var $total_wins = 0; 
                    for( var $u of this.current_bets ){
                        if( this.cur_cf >= $u.cf ){ 
                            $u.win = true; 
                            var $line = $('#current_bets_list ul li[data-uid="'+ $u.uid +'"]'); 
                            if( !$line.hasClass('active') ){
                                $line.addClass('active'); 
                                $('.betx', $line).html( ( +$u.cf ).toFixed(2) ).addClass( +$u.cf > 6 ? 'high' : ( +$u.cf > 2 ? 'mid' : '' ) );
                                $('.win', $line).html( ( +$u.cf * +$u.amount ).toFixed(2) ); 
                            }
                            $total_wins += parseFloat( +$u.cf * +$u.amount ); 
                        }
                    } 
                    // Оптимизированное обновление кнопок
                    if (!this.lastButtonUpdate || ($timer - this.lastButtonUpdate) > 100) {
                        this.lastButtonUpdate = $timer;
                        $('#actions_wrapper .make_bet.warning').each(function(){ 
                            var $self=$(this); 
                            var $bet_id = parseInt( $self.attr('data-id') ); 
                            if( $bet_id ){
                                var $src = parseInt( $self.attr('data-src') );
                                var $wrap=$self.parent().parent().parent().parent(); 
                                var $bet = parseFloat( $('input[type="text"]', $wrap).val() ); 
                                var $cf = parseFloat( $game.cur_cf ); 
                                var $result = ( $bet * $cf ).toFixed(2); 
                                var $cash_out = parseFloat( $('[name="cashout_value"]', $wrap).val() );
                                $('h2 [data-rel="current_bet"]', $self).html( $result ); 
                                if( $('[name="cashout_switcher"]', $wrap).is(':checked') ){ 
                                    if( $cash_out <= $cf ){ $self.click(); }
                                } 
                            }
                        });
                    }
                    $('#bets_wrapper .info_window [data-rel="bets"] .label').html( ( $total_wins * this.factor ).toFixed(2) ); 
                    var $players = $('#current_bets_list ul li').length; 
                    var $winners = $('#current_bets_list ul li.active').length ; 
                    var $perc = $winners / ( $players / 100 )
                    $('#bets_wrapper .info_window [data-rel="bets"] .cur').html( $winners*this.factor ); 
                    $('#bets_wrapper .progresser').css('width', $perc+'%');
                }
                break; 
            case "finish": 
                if( $change ){ 
                    //this.finish_to_loading({ cf:this.win_cf, delta:SETTINGS.timers.flight }); 
                }
                break; 
        }
    }
    autostart(){
        for( var $auto of this.autoplay ){ 
            var $play = false; 
            if( +$auto.id ){ 
                // проверяем не упали ли ниже плинтуса 
                if( $auto.isisdecrease ){
                    if( $auto.decrease < $user.balance ){ $play = true; } 
                    else { $play = false; this.autostop({id:$auto.id}); }
                }
                // проверяем не переработали ли 
                if( $auto.isincrease ){
                    if( $auto.increase > $user.balance ){ $play = true; } 
                    else { $play = false; this.autostop({id:$auto.id}); }
                } 
                // проверяем общий выигрыш 
                if( $auto.iswins ){
                    if( $auto.wins > $auto.numwins ){ $play = true; }
                    else { $play = false; this.autostop({id:$auto.id}); }
                }
                // проверяем не кончились ли попытки
                if( $auto.rounds > $auto.numrounds ){ $play = true; } 
                else { $play = false; this.autostop({id:$auto.id}); }
                // 
                if( $play ){ 
                    var $wrap = $('.actions_field[data-id="'+$auto.id+'"]');
                    var $bet = parseFloat( $('.ranger input[type="text"]', $wrap).val() ); 
                    var $is_cash_out = $('[name="cashout_switcher"]', $wrap).is(':checked');
                    var $cash_out = parseFloat( $('[name="cashout_value"]', $wrap).val() ); 
                    if( $bet && $is_cash_out && $cash_out ){
                        // генерим ставку
                        this.bet_add({ type: "auto", src: $auto.id, bet: $bet }); 
                        $('.autoplay[data-id="'+$auto.id+'"]').html(LOCALIZATION.autobet_generic_stop+' ('+( $auto.rounds - $auto.numrounds )+')'); 
                        $auto.numrounds += 1; 
                        console.log("Make auto bet: ",{ type: "auto", src: $auto.id, bet: $bet });
                    } 
                    else {
                        // игра пропускается, готовы не все данные
                        console.log("Wait data for bet for autoplay "+$auto.id);
                    }
                }
            } 
        }
    } 
    autocheck(){
        for( var $auto of this.autoplay ){ 
            if( +$auto.bet ){
                var $wrap = $('.actions_field[data-id="'+ $auto.id +'"]'); 
                var $bet = parseFloat( $('.ranger input[type="text"]', $wrap).val() ); 
                var $cash_out = $('[name="cashout_switcher"]', $wrap).is(':checked'); 
                var $out_cf = parseFloat( $('[name="cashout_value"]', $wrap).val() ); 
                var $cf = parseFloat( this.cur_cf ); 
                var $result = $bet * $cf;
                if( $out_cf <= $cf ){
                    this.bet_complete({ id:$auto.bet, cf:$cf, type:'auto', src:$auto.id }); 
                    $('.autoplay[data-id="'+$auto.id+'"]').html(LOCALIZATION.autobet_generic_stop+' ('+( $auto.rounds - $auto.numrounds )+')'); 
                    this.autoplay[ (+$auto.id-1) ].bet = 0; 
                    this.autoplay[ (+$auto.id-1) ].numwins += $result; 
                    this.modal({ cf:$cf, result:$result }); 
                }
            }
        }
    }
    autostop( $data ){
        var $id = +$data.id; 
        if( $id ){
            this.bet_edit({ id:( this.autoplay[ ($id-1) ].bet ), src: $id, status: 5 });  
            this.autoplay[ ($id-1) ] = {
                id: 0, 
                bet: 0, 
                rounds: 0, 
                numrounds: 0, 
                isisdecrease: 0, 
                decrease: 0, 
                isincrease:0, 
                increase: 0, 
                iswins: 0, 
                wins: 0, 
                numwins: 0 
            } 
            $('.autoplay[data-id="'+$id+'"]').html(LOCALIZATION.autobet_generic_autoplay).removeClass('active').off().on('click', function(){
                $('#autoplay_modal').css('display', 'flex').attr('data-id', $(this).data('id'));
            });
            //$('.actions_field[data-id="'+$id+'"]').removeClass('disabled');
            $('make_bet[data-src="'+$id+'"]').removeAttr('disabled');
            //$('.actions_field[data-id="'+$id+'"] .fast_bet').removeAttr('disabled');
        }
    }
    
    // DEPRECATED
    game_create( $data ){
        // Database removed - game state managed by WebSocket
        console.log("game_create called (deprecated, using WebSocket)");
    } 
    // DEPRECATED 
    game_start( $data ){
        console.log("game_start called (deprecated, using WebSocket)");
    } 
    // DEPRECATED
    game_close( $data ){
        console.log("game_close called (deprecated, using WebSocket)");
    }
    
    clear_level( $data ){
        var $cf = $data.cf ? +$data.cf : +this.win_cf; 
        $('#last_cf').html( $cf+'x').removeClass('low').removeClass('mid').removeClass('high'); 
        $('#last_cf').addClass( $cf >= 5 ? 'high' : ( $cf >= 2 ? 'mid' : 'low' ) ); 
        var $wrap = $('#previous_bets_list ul');
        $wrap.html(``); 
        if( this.current_bets && this.current_bets.length ){ 
            for( var $u of this.current_bets ){
                var $tmps = `<li data-uid="${ $u.uid }" class="${ $cf >= $u.cf ? 'active' : '' }"> 
                                    <div class="user"><img src="res/img/users/av-${ $u.img }.png" alt=""><span>${ $u.name }</span></div> 
                                    <div class="bet">${ ( $u.amount ).toFixed(2) }</div> 
                                    <div class="betx">${ ( $u.cf ).toFixed(2) }</div> 
                                    <div class="win">${ $cf >= $u.cf ? ( ( $u.cf * $u.amount ).toFixed(2) ) : 0 }</div> 
                                </li>`; 
                $wrap.append( $tmps ); 
            }
        } 
        this.get_bets({ user:$user.uid, sort:'id', dir:'desc' });
    } 
    bet_add( $data ){
        // Database removed - simulate bet locally
        console.log("Adding bet locally:", $data);
        console.log("Current balance:", $user.balance);
        console.log("Bet amount:", $data.bet);
        
        // Check if user has enough balance
        if($user.balance < parseFloat($data.bet)) {
            console.error("Insufficient balance!");
            var $btn = $('.make_bet[data-src="'+$data.src+'"]');
            $btn.removeClass('danger').removeClass('warning');
            alert("Insufficient balance!");
            return;
        }
        
        // Simulate successful bet response
        var $obj = {
            success: Date.now(), // Use timestamp as bet ID
            balance: $user.balance - parseFloat($data.bet),
            error: false // Explicitly set no error
        };
        
        // Update user balance
        $user.balance = $obj.balance;
        console.log("New balance:", $user.balance);
        
        // Process the bet
        (function($r){
            console.log("Bet add response:", $obj, "for src:", $data.src);
            if( $obj.success ){ 
                    $game.user_bets[ $data.src-1 ] = +$obj.success; 
                    console.log("Updated user_bets:", $game.user_bets, "src:", $data.src);
                    
                    // Добавляем ставку пользователя в список текущих ставок
                    var userBet = {
                        uid: $user.uid,
                        name: $user.real_name || $user.name || "You",
                        amount: parseFloat($data.bet),
                        cf: 10.0, // Случайный коэффициент для вывода
                        img: $user.img || 10,
                        win: false
                    };
                    
                    // Проверяем, нет ли уже ставки этого пользователя
                    var existingBetIndex = -1;
                    for(var i = 0; i < $game.current_bets.length; i++) {
                        if($game.current_bets[i].uid == $user.uid) {
                            existingBetIndex = i;
                            break;
                        }
                    }
                    
                    if(existingBetIndex >= 0) {
                        // Обновляем существующую ставку
                        $game.current_bets[existingBetIndex] = userBet;
                        var $line = $('#current_bets_list ul li[data-uid="'+ $user.uid +'"]');
                        $('.bet', $line).html(userBet.amount.toFixed(2));
                    } else {
                        // Добавляем новую ставку
                        $game.current_bets.push(userBet);
                        var $tmps = `<li data-uid="${ userBet.uid }"> 
                                        <div class="user"><img src="res/img/users/av-${ userBet.img }.png" alt=""><span>${ userBet.name }</span></div> 
                                        <div class="bet">${ userBet.amount.toFixed(2) }</div> 
                                        <div class="betx"></div> 
                                        <div class="win"></div> 
                                    </li>`;
                        $('#current_bets_list ul').append($tmps);
                    }
                    
                    // Обновляем счетчики
                    var totalBets = $game.current_bets.length * $game.factor;
                    $('#game_bets .label').html(totalBets); 
                    $('#bets_wrapper .info_window [data-rel="bets"] .cur').html(totalBets);
                    $('#bets_wrapper .info_window [data-rel="bets"] .total').html(totalBets);
                    
                    if( $data['type'] == "manual" ){ 
                        var $btn = $('.make_bet[data-src="'+ $data.src +'"]');
                        $btn.attr('data-id', $obj.success); 
                        console.log("✓ Bet placed successfully! Set data-id", $obj.success, "for button", $data.src);
                        console.log("  Button state:", {
                            'data-id': $btn.attr('data-id'),
                            'classes': $btn.attr('class'),
                            'text': $('span', $btn).text()
                        });
                    } 
                    else {
                        $game.autoplay[ ($data.src-1) ].bet = +$obj.success;
                        //$('.auto_out_switcher input[data-src="'+ $data.src +'"]').attr('data-id', $obj.success); 
                    }
                } 
                if( $obj.balance ){
                    var $balance = parseFloat( $obj.balance ); 
                    $('[data-rel="balance"]').val( $balance ).html( $balance );
                } 
                if( $obj.error ){
                    console.log("Bet error:", $obj.msg || $obj.error);
                    if( $data.type == "manual" ){
                        var $btn = $('.make_bet[data-src="'+$data.src+'"]');
                        $btn.removeClass('danger').removeClass('warning');
                        $game.user_bets[ $data.src-1 ] = 0;
                        $btn.attr('data-id', 0);
                        $('span', $btn ).html(LOCALIZATION.make_bet_generic_bet);
                        $('h2', $btn).css('display','flex');
                        $('h3', $btn).hide();
                        $('.actions_field[data-id="'+$data.src+'"]').removeClass('disabled');
                        $('.actions_field[data-id="'+$data.src+'"] .fast_bet').removeAttr('disabled');
                        $('.actions_field[data-id="'+$data.src+'"] .autoplay').removeAttr('disabled');
                    }
                    if( $data.type == "auto" ){
                        $('.actions_field[data-id="'+$data.src+'"] .autoplay').click();
                    }
                }
        })($obj); // Execute immediately with simulated response
    }
    bet_edit( $data ){ 
        // Database removed - cancel bet locally
        console.log("Canceling bet locally:", $data);
        
        // Return bet amount to balance if status is 5 (cancelled)
        if($data.status == 5) {
            var betAmount = 0;
            // Find bet amount from user_bets
            var betId = $game.user_bets[$data.src - 1];
            if(betId) {
                // Estimate bet amount from current bets
                for(var i = 0; i < $game.current_bets.length; i++) {
                    if($game.current_bets[i].uid == $user.uid) {
                        betAmount = $game.current_bets[i].amount;
                        break;
                    }
                }
                // Return money to balance
                $user.balance += betAmount;
            }
        }
        
        var $obj = { success: true, balance: $user.balance };
        
        $game.user_bets[ $data.src-1 ] = 0; 
        
        // Удаляем ставку пользователя из списка текущих ставок
        for(var i = 0; i < $game.current_bets.length; i++) {
            if($game.current_bets[i].uid == $user.uid) {
                $game.current_bets.splice(i, 1);
                break;
            }
        }
        
        // Удаляем из DOM
        $('#current_bets_list ul li[data-uid="'+ $user.uid +'"]').remove();
        
        // Обновляем счетчики
        var totalBets = $game.current_bets.length * $game.factor;
        $('#game_bets .label').html(totalBets); 
        $('#bets_wrapper .info_window [data-rel="bets"] .cur').html(totalBets);
        $('#bets_wrapper .info_window [data-rel="bets"] .total').html(totalBets);
        
        if( $data['type'] == "manual" ){ $('.make_bet[data-src="'+ $data.src +'"]').attr('data-id', 0); } 
        else { $('.auto_out_switcher input[data-src="'+ $data.src +'"]').attr('data-id', 0); }
        
        var $balance = parseFloat( $obj.balance ); 
        $('[data-rel="balance"]').val( $balance ).html( $balance );
    }
    bet_complete( $data ){ 
        // Database removed - simulate cashout locally
        console.log("Cashing out bet locally:", $data);
        
        var winAmount = $data.cf ? (parseFloat($data.bet) * parseFloat($data.cf)) : 0;
        var $obj = {
            success: true,
            balance: $user.balance + winAmount
        };
        
        // Update user balance
        $user.balance = $obj.balance;
        
        // Process cashout
        if( $obj.success ){ 
            $game.user_bets[ $data.src-1 ] = 0; 
            if( $data['type'] == "manual" ){ $('.make_bet[data-src="'+ $data.src +'"]').attr('data-id', 0); } 
            else { $('.auto_out_switcher input[data-src="'+ $data.src +'"]').attr('data-id', 0); }
        } 
        if( $obj.balance ){
            var $balance = parseFloat( $obj.balance ); 
            $('[data-rel="balance"]').val( $balance ).html( $balance );
        }
        $game.get_bets({ user:$user.uid, sort:'id', dir:'desc' });
    }
    bet_generic( $data ){
        // Генерируем фейковые ставки чаще и больше в начале игры
        var currentTime = Date.now();
        var timeSinceLastGeneration = this.lastBetGeneration ? (currentTime - this.lastBetGeneration) : 0;
        var shouldGenerate = false;
        
        // В начале игры (loading) генерируем чаще
        if (this.status === "loading") {
            shouldGenerate = !this.lastBetGeneration || timeSinceLastGeneration > 500; // Каждые 0.5 секунды
        } else {
            shouldGenerate = !this.lastBetGeneration || timeSinceLastGeneration > 2000; // Каждые 2 секунды
        }
        
        if (shouldGenerate && this.current_bets.length < 35) {
            this.lastBetGeneration = currentTime;
            
            // Создаем массив фейковых пользователей если его нет
            if (!window.$users || !$users.length) {
                window.$users = this.generateFakeUsers();
            }
            
            var $bets = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 50, 75, 100];
            var betsToAdd = [];
            var maxBetsToAdd = this.status === "loading" ? 8 : 3; // Больше ставок в начале
            
            for (var i = 0; i < $users.length && betsToAdd.length < maxBetsToAdd; i++) {
                var $u = $users[i];
                var chance = this.status === "loading" ? 15 : this.generic_chanse; // Выше шанс в начале
                
                if ((Math.random() * 100 >= chance) && $u.name) {
                    var $add = true;
                    for (var $v of this.current_bets) {
                        if ($v.uid == $u.uid) {
                            $add = false;
                            break;
                        }
                    }
                    
                    if ($add) {
                        var $amount = $bets[Math.round(Math.random() * ($bets.length - 1))];
                        
                        // Определяем, должна ли эта ставка выиграть (50% шанс)
                        var shouldWin = Math.random() < 0.5;
                        var $cf;
                        
                        if (shouldWin) {
                            // Для выигрышных ставок устанавливаем коэффициент ниже будущего результата игры
                            // Используем коэффициенты от 1.1 до 3.0 для большинства выигрышей
                            $cf = parseFloat((1.1 + Math.random() * 1.9).toFixed(2));
                        } else {
                            // Для проигрышных ставок устанавливаем высокий коэффициент
                            $cf = parseFloat((5.0 + Math.random() * 10.0).toFixed(2));
                        }
                        
                        betsToAdd.push({
                            uid: $u.uid,
                            name: $u.name,
                            amount: $amount,
                            cf: $cf,
                            img: $u.img,
                            win: false,
                            shouldWin: shouldWin  // Добавляем флаг для отслеживания
                        });
                    }
                }
            }
            
            // Добавляем все ставки одним блоком
            if (betsToAdd.length > 0) {
                var htmlToAdd = '';
                for (var bet of betsToAdd) {
                    htmlToAdd += `<li data-uid="${ bet.uid }"> 
                                    <div class="user"><img src="res/img/users/av-${ bet.img }.png" alt=""><span>${ bet.name }</span></div> 
                                    <div class="bet">${ bet.amount }</div> 
                                    <div class="betx"></div> 
                                    <div class="win"></div> 
                                </li>`;
                    this.current_bets.push(bet);
                }
                $('#current_bets_list ul').append(htmlToAdd);
                
                // Обновляем счетчики одним разом
                var totalBets = this.current_bets.length * this.factor;
                $('#game_bets .label').html(totalBets); 
                $('#bets_wrapper .info_window [data-rel="bets"] .cur').html(totalBets);
                $('#bets_wrapper .info_window [data-rel="bets"] .total').html(totalBets);
            }
        }
    }
    
    // Генерируем фейковых пользователей
    generateFakeUsers() {
        var fakeNames = [
            "Alex", "Maria", "John", "Anna", "Mike", "Lisa", "David", "Sarah", "Tom", "Emma",
            "Chris", "Kate", "Paul", "Nina", "Mark", "Olga", "Steve", "Vera", "Nick", "Lena",
            "Max", "Ira", "Dan", "Mila", "Sam", "Anya", "Ben", "Tina", "Leo", "Eva",
            "Jake", "Zoe", "Ryan", "Amy", "Luke", "Joy", "Adam", "Sue", "Carl", "Ivy",
            "Ivan", "Dima", "Oleg", "Igor", "Vlad", "Roma", "Petr", "Serg", "Yura", "Gleb"
        ];
        
        var users = [];
        for (var i = 0; i < fakeNames.length; i++) {
            users.push({
                uid: 1000 + i,
                name: fakeNames[i],
                img: Math.floor(Math.random() * 20) + 1
            });
        }
        return users;
    }
    get_history( $data ){ 
        $.ajax({
            url: "index.php?route=api/games/history", 
            type:"json", 
            method: "post", 
            data: $data, 
            error: function($e){ console.error($e); },
            success: function($r){
                var $obj = typeof $r == "string" ? eval('('+$r+')') : $r; 
                if( $obj && $obj.length ){ 
                    var $wrap = $('#history_wrapper .wrapper .inner'); 
                    $wrap.html(``);
                    for( var $h of $obj ){
                        var $amount = +$h.amount; 
                        var $tmps = `<span class="${ $h.amount >= 5 ? 'high' : ( $h.amount >= 2 ? 'mid' : 'low' ) }">${ $h.amount }</span>`; 
                        $wrap.append($tmps);
                    }
                }
            }
        });
    } 
    get_bets( $data ){ 
        // Database removed - no bet history to load
        console.log("get_bets called (database removed)");
    }
    balance( $data ){ 
        // Database removed - use local balance
        var $balance = parseFloat( $user.balance || 500 ); 
        $('[data-rel="balance"]').val( $balance ).html( $balance );
        console.log("Balance updated:", $balance);
    }
    // Функция для сохранения результата игры с конвертацией валют
    save_game_result( $data ){
        $.ajax({
            url: "index.php?route=api/users/save_game_result",
            type: "json",
            method: "post",
            data: $data,
            error: function($e){ console.error($e); },
            success: function($r){
                if( $r && $r.success ){
                    var $balance = parseFloat( $r.balance );
                    if( $balance ){
                        $('[data-rel="balance"]').val( $balance ).html( $balance );
                    }
                    
                    // Отправляем баланс в национальной валюте родительскому окну
                    if( window.parent && window.parent !== window && $r.balance_national ){
                        window.parent.postMessage({
                            type: 'balanceUpdated',
                            balance: parseFloat($r.balance_national).toFixed(2), // Отправляем в национальной валюте
                            userId: window.$user.host_id
                        }, '*');
                    }
                }
            }
        });
    }
    
    // Функция для обновления баланса с конвертацией валют
    update_balance( $data ){
        $.ajax({
            url: "index.php?route=api/users/update_balance",
            type: "json",
            method: "post",
            data: $data,
            error: function($e){ console.error($e); },
            success: function($r){
                if( $r && $r.success ){
                    var $balance = parseFloat( $r.balance );
                    if( $balance ){
                        $('[data-rel="balance"]').val( $balance ).html( $balance );
                    }
                    
                    // Отправляем баланс в национальной валюте родительскому окну
                    if( window.parent && window.parent !== window && $r.balance_national ){
                        window.parent.postMessage({
                            type: 'balanceUpdated',
                            balance: parseFloat($r.balance_national).toFixed(2), // Отправляем в национальной валюте
                            userId: window.$user.host_id
                        }, '*');
                    }
                }
            }
        });
    }
    
    modal( $data ){
        var $wrap = $('#modal_wrapper'); 
        var $cf = $data.cf ? ( parseFloat( $data.cf ) ).toFixed(2) : 0; 
        $('.multiplier .value', $wrap).html( $cf+"x");
        var $result = $data.result ? ( parseFloat( $data.result ) ).toFixed(2) : 0; 
        $('.win .value', $wrap).html( $result );
        $wrap.addClass('active'); 
        SOUNDS.sounds.play('win'); 
        setTimeout(function(){ $('#modal_wrapper').removeClass('active'); }, 3000);
    } 

    // SOCKET FUNC
    loading_to_flying( $data ){ 
        console.log("Data to flight: ", $data);
        this.status = "flight"; 
        SETTINGS.timers.flight = $data.delta; 
        this.timer = new Date().getTime(); 
        this.win_cf = $data.cf; 
        this.cur_cf = 1; 
        $plane.status = "move"; 
        $plane.pos = 0;  
        $plane.x = SETTINGS.start.x; 
        $plane.y = SETTINGS.start.y; 
        $('.make_bet').each(function(){
            var $self = $(this);  
            var $src = $self.attr('data-src');
            var $id = +$self.attr('data-id'); 
            console.log("Loading to flying - Button src:", $src, "id:", $id);
            if( $id ){
                $self.removeClass('danger').addClass('warning'); 
                $('span', $self).html(LOCALIZATION.make_bet_generic_cashout).css('display', 'flex');
                $('h2', $self).css('display', 'flex');
                $('h3', $self).hide();
                console.log("Button", $src, "set to cashout mode");
            } 
            else {
                // Кнопка без ставки остается в режиме "сделать ставку" - не изменяем ее состояние
                console.log("Button", $src, "has no bet - keeping in bet mode");
            }
        }); 
        $('#loading_level').css('display','none'); 
        $('#process_level').css('display', 'flex'); 
        $('#complete_level').css('display', 'none'); 
        $('#bets_wrapper .progresser').css('width', '100%').data('freq', '100'); 
        $('#actions_wrapper .actions_field').addClass('disabled'); 
        $('#actions_wrapper .actions_field .fast_bet').attr('disabled', "disabled"); 
        $('.autoplay').attr('disabled','disabled');
        this.autostart();  
        if( SETTINGS.volume.active ){ SOUNDS.sounds.play('start'); }
    }
    flying_to_finish( $data ){ 
        console.log("Data to finish: ", $data); 
        this.status = "finish"; 
        SETTINGS.timers.finish = $data.delta; 
        this.timer = new Date().getTime(); 
        this.cur_cf = this.win_cf;
        $plane.trace = false; 
        $plane.pos = 5; 
        this.clear_level({ cf: this.win_cf }); 
        $('#loading_level .progresser').css('width','100%').attr('data-freq', '100');
        $('#process_level .current').attr('data-amount',1);
        // close bets 
        this.user_bets = [ 0, 0 ]; 
        //this.game_close({}); 
        $('#loading_level').css('display','none'); 
        $('#process_level').css('display', 'none');
        $('#complete_level').css('display', 'flex');
        $('#complete_level .result').html( this.cur_cf+"x"); 
        $('#actions_wrapper .make_bet').each(function(){ 
            var $self=$(this); 
            var $wrap=$self.parent().parent(); 
            var $bet = parseFloat( $('input[type="text"]', $wrap).val() );  
            $('h2 [data-rel="current_bet"]', $self).html( $bet );
        }); 
        //$('#actions_wrapper .actions_field').each(function(){
        //    var $self=$(this); 
        //}); 
        $('#actions_wrapper .actions_field').removeClass('disabled'); 
        $('#actions_wrapper .actions_field .fast_bet').removeAttr('disabled'); 
        for( var $auto of this.autoplay ){
            if( $auto.id ){
                $('.autoplay[data-id="'+$auto.id+'"]').html(LOCALIZATION.autobet_generic_stop +' ('+( $auto.rounds - $auto.numrounds )+')'); 
            }
        }
        $('.make_bet span').html(LOCALIZATION.make_bet_generic_bet); 
        $('.make_bet h3').hide(); 
        $('.make_bet h2').css('display','flex'); 
        $('.make_bet').removeClass('danger').removeClass('warning').attr('data-id', 0); 
        $('.autoplay').removeAttr('disabled');
        setTimeout( $game.balance, 1000 ); 
        if( SETTINGS.volume.active ){ SOUNDS.sounds.play('away'); } 
        //this.get_history({}); 
        this.get_bets({ user:$user.uid, sort:'id', dir:'desc' });
        this.balance(); 
    } 
    finish_to_loading( $data ){ 
        console.log("Data to loading: ", $data);
        this.status = "loading"; 
        this.timer = new Date().getTime(); 
        SETTINGS.timers.loading = $data.delta; 
        this.win_cf = $data.cf; 
        this.cur_cf = 1; 
        $plane.status = "idle"; 
        $plane.pos = 0; 
        $plane.trace = true; 
        $plane.x = SETTINGS.start.x; 
        $plane.y = SETTINGS.start.y; 
        $('#loading_level').css('display','flex'); 
        $('#process_level').css('display', 'none');
        $('#complete_level').css('display', 'none');
        this.current_bets = []; 
        $('#current_bets_list ul').html('');
        $('#game_bets .label').html( 0 );
        $('#bets_wrapper .info_window [data-rel="bets"] .label').html( 0 );
        $('#bets_wrapper .info_window [data-rel="bets"] .cur').html( 0 );
        $('#bets_wrapper .info_window [data-rel="bets"] .total').html( 0 ); 
        // BUTTONS - Reset each button individually
        $('.make_bet').each(function(){
            var $btn = $(this);
            var $src = $btn.attr('data-src');
            $('span', $btn).html(LOCALIZATION.make_bet_generic_bet); 
            $('h3', $btn).hide(); 
            $('h2', $btn).css('display','flex'); 
            $btn.removeClass('danger').removeClass('warning');
            // Only reset data-id if there's no active bet for this button
            if( !$game.user_bets[$src-1] ) {
                $btn.attr('data-id', 0); 
            }
        }); 
        
        // Добавляем много фейковых ставок сразу в начале
        this.addInitialFakeBets();
        
        //
        this.balance(); 
        this.get_bets({ user:$user.uid, sort:'id', dir:'desc' });
        this.get_history({});
    }
    
    // Добавляем много фейковых ставок в начале игры
    addInitialFakeBets() {
        if (!window.$users || !$users.length) {
            window.$users = this.generateFakeUsers();
        }
        
        var $bets = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 50, 75, 100];
        var betsToAdd = [];
        var initialBetsCount = Math.floor(Math.random() * 15) + 10; // От 10 до 25 ставок
        
        // Перемешиваем пользователей для случайности
        var shuffledUsers = [...$users].sort(() => Math.random() - 0.5);
        
        for (var i = 0; i < Math.min(initialBetsCount, shuffledUsers.length); i++) {
            var $u = shuffledUsers[i];
            var $amount = $bets[Math.round(Math.random() * ($bets.length - 1))];
            
            // Определяем, должна ли эта ставка выиграть (50% шанс)
            var shouldWin = Math.random() < 0.5;
            var $cf;
            
            if (shouldWin) {
                // Для выигрышных ставок устанавливаем коэффициент ниже будущего результата игры
                // Используем коэффициенты от 1.1 до 3.0 для большинства выигрышей
                $cf = parseFloat((1.1 + Math.random() * 1.9).toFixed(2));
            } else {
                // Для проигрышных ставок устанавливаем высокий коэффициент
                $cf = parseFloat((5.0 + Math.random() * 10.0).toFixed(2));
            }
            
            betsToAdd.push({
                uid: $u.uid,
                name: $u.name,
                amount: $amount,
                cf: $cf,
                img: $u.img,
                win: false,
                shouldWin: shouldWin  // Добавляем флаг для отслеживания
            });
        }
        
        // Добавляем все ставки одним блоком
        if (betsToAdd.length > 0) {
            var htmlToAdd = '';
            for (var bet of betsToAdd) {
                htmlToAdd += `<li data-uid="${ bet.uid }"> 
                                <div class="user"><img src="res/img/users/av-${ bet.img }.png" alt=""><span>${ bet.name }</span></div> 
                                <div class="bet">${ bet.amount }</div> 
                                <div class="betx"></div> 
                                <div class="win"></div> 
                            </li>`;
                this.current_bets.push(bet);
            }
            $('#current_bets_list ul').html(htmlToAdd);
            
            // Обновляем счетчики
            var totalBets = this.current_bets.length * this.factor;
            $('#game_bets .label').html(totalBets); 
            $('#bets_wrapper .info_window [data-rel="bets"] .cur').html(totalBets);
            $('#bets_wrapper .info_window [data-rel="bets"] .total').html(totalBets);
        }
    }
}

// Plane will be created in document.ready
var $plane;  

var $game = new Game({}); 

function render( obj ){
    $ctx.clearRect( 0, 0, SETTINGS.w, SETTINGS.h );
    
    // Оптимизированный фон
    $ctx.fillStyle = "#001122";
    $ctx.fillRect(0, 0, SETTINGS.w, SETTINGS.h);
    
    if( $game ){ $game.update({}); }
    if( $plane ){ 
        $plane.update({});
    }
    requestAnimationFrame( render );
}

function open_game(){ 
    $('#splash').addClass('show_modal');
    var $cur_settings = SETTINGS.volume.active ; 
    SETTINGS.volume.active = 0; 
    $('#splash button').off().on('click', function(){
        $('#splash').remove(); 
        if( $cur_settings ){ 
            SETTINGS.volume.active = $cur_settings; 
            SOUNDS.music.play(); 
            $('#sound_switcher').removeClass('off'); 
        }
        else {
            $('#sound_switcher').addClass('off'); 
        }
    }); 
} 
/*
$(window).on('resize', function(){
    SETTINGS.w = $('#canvas').width(); 
    SETTINGS.h = $('#canvas').height(); 
    $canvas = document.getElementById("canvas");
    $ctx = $canvas.getContext("2d");
    $canvas.width = SETTINGS.w; 
    $canvas.height = SETTINGS.h; 
});
*/

$(document).ready(function(){
    // window.$socket = new Socket(); 
    // $socket.init(); 
});
// Splash screen removed - no need to open game modal

// Connect to WebSocket server on port 2345
console.log('Connecting to WebSocket server...');
// var socket = io.connect('http://127.0.0.1:2345', {
//     transports: ['websocket', 'polling'],
//     reconnection: true,
//     reconnectionDelay: 1000,
//     reconnectionAttempts: 10
// });

var socket = io.connect('wss://aviator.valor-games.co/ws/', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
});


socket.on('connect', function() {
    console.log('✓ Connected to WebSocket server!');
});

socket.on('connect_error', function(error) {
    console.error('✗ WebSocket connection error:', error);
});

socket.on('disconnect', function() {
    console.log('✗ Disconnected from WebSocket server');
});

// Handle coefficient updates during flight
socket.on('coefficient', function(data) {
    console.log('Coefficient update:', data);
    var $obj = typeof data == "string" ? JSON.parse(data) : data;
    if($obj && $obj.cf && $game.status === 'flight') {
        $game.cur_cf = parseFloat($obj.cf);
    }
});

socket.on('message', ( msg ) => { 
    console.log('New message: ', msg ); 
    var $obj = typeof msg == "string" ? eval('('+ msg +')') : msg; 
    console.log("Compiled: ", $obj); 
    if( $obj && $obj.msg && $obj.msg == "Change game state" ){
        var $data = { 
            state: $obj.game && $obj.game.state ? $obj.game.state : '', 
            cf: $obj.game && $obj.game.cf ? parseFloat( $obj.game.cf ).toFixed(2) : 1, 
            delta: $obj.game && $obj.game.delta ? parseInt( $obj.game.delta ) : 0 
        } 
        console.log('Game state change:', $data);
        switch( $data.state ){
            case "loading": 
                $game.finish_to_loading( $data ); 
                break; 
            case "flying": 
                $game.loading_to_flying( $data );
                break; 
            case "finish": 
                $game.flying_to_finish( $data );
                break; 
        }
    }
});

// Initialize the game when DOM is ready
$(document).ready(function() {
    console.log("Game initialization started");
    
    // Initialize balance display
    if(window.$user && $user.balance) {
        console.log("Setting initial balance:", $user.balance);
        // Принудительно обновляем все элементы с балансом
        setBalanceDisplay($user.balance);
    } else {
        // Fallback - set demo balance if user data is missing
        console.log("No user balance found, setting demo balance");
        setBalanceDisplay(500);
        if(!window.$user) {
            window.$user = {
                uid: 'demo_' + Date.now(),
                name: 'Demo Player',
                real_name: 'Demo Player',
                balance: 500,
                host_id: 0
            };
        }
    }
    
    // Observe balance elements for changes and truncate to 2 decimals
    try {
        var balanceNodes = document.querySelectorAll('[data-rel="balance"], #main_balance');
        balanceNodes.forEach(function(node){
            var obs = new MutationObserver(function(mutations){
                mutations.forEach(function(m){
                    var el = m.target.nodeType === Node.TEXT_NODE ? m.target.parentNode : m.target;
                    var text = (el.textContent || '').trim();
                    if (text) {
                        var n = parseFloat(text.replace(/[^\d\.\-]/g, ''));
                        if (!isNaN(n)) {
                            var disp = trunc2(n);
                            if (el.textContent !== disp) {
                                el.textContent = disp;
                            }
                            if ('value' in el && el.value !== disp) {
                                el.value = disp;
                            }
                        }
                    }
                });
            });
            obs.observe(node, {characterData: true, childList: true, subtree: true});
        });
    } catch(e) { console.warn('Balance observer error', e); }

    // Fix canvas size after DOM is ready
    SETTINGS.w = document.querySelector('#game_field').offsetWidth;
    SETTINGS.h = document.querySelector('#game_field').offsetHeight;
    SETTINGS.start.y = SETTINGS.h - 50; // Position plane near bottom
    
    $canvas.width = SETTINGS.w; 
    $canvas.height = SETTINGS.h; 
    
    console.log("Canvas size:", SETTINGS.w, "x", SETTINGS.h);
    console.log("Plane start position:", SETTINGS.start);
    
    // Create plane with correct settings
    $plane = new Plane({ 
        ctx: $ctx, 
        x: SETTINGS.start.x, 
        y: SETTINGS.start.y, 
        w: SETTINGS.w*0.15, 
        h: SETTINGS.w*0.15/2, 
        chart: new Chart({ 
            ctx: $ctx, 
            sx: SETTINGS.start.x, 
            sy: SETTINGS.start.y, 
            ax: SETTINGS.start.x, 
            ay: SETTINGS.start.y, 
            fx: SETTINGS.start.x, 
            fy: SETTINGS.start.y 
        })
    });
    
    console.log("Plane created at:", $plane.x, $plane.y);
    
    // Start the render loop
    render();
    
    // Initialize game bindings
    console.log("Calling $game.bind()");
    $game.bind();
    console.log("$game.bind() completed");
    
    // Load initial balance
    $game.balance();
    
    // Splash screen removed - game starts immediately
    
    console.log("Game initialization completed");
});





