<?php
    //$_SESSION['user'] = Users::GI()->get([ 'uid'=>UID ]);
    include_once BASE_DIR ."common.php";  
?>
<script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
<script>
    var UID = "<?= isset($_SESSION['user']['uid']) ? $_SESSION['user']['uid'] : ''; ?>"; 
    <?php 
    // Пользователь уже настроен в common.php, не перезаписываем его данные
    ?>
    window.$user = <?= json_encode( $_SESSION['user'] ); ?>;
    window.$users = <?= json_encode( Users::GI()->active() ); ?>;
    console.log("User data loaded:", window.$user);
    console.log("DEBUG - HOST_ID:", "<?= HOST_ID; ?>");
    console.log("DEBUG - AUTH:", "<?= AUTH; ?>");
    console.log("DEBUG - UID:", "<?= UID; ?>");
    console.log("DEBUG - _GET:", <?= json_encode($_GET); ?>);
    console.log("DEBUG - _REQUEST:", <?= json_encode($_REQUEST); ?>);
    
    // Принудительно обновляем баланс в интерфейсе
    function trunc2(val) {
        var n = Number(val);
        if (isNaN(n)) return '0.00';
        return (Math.floor(n * 100) / 100).toFixed(2);
    }
    $(document).ready(function() {
        if(window.$user && $user.balance !== undefined && $user.balance !== null) {
            var disp = trunc2($user.balance);
            console.log("Updating balance in template:", $user.balance, "->", disp);
            $('#main_balance').html(disp);
            $('[data-rel="balance"]').each(function() {
                $(this).val(disp).html(disp).text(disp);
            });
        }
    });
</script>
<div id="main_wrapper"> 
    <header id="header">
        <a href="/" id="main_link"><img src="res/img/label.svg" alt="Aviator"></a>
        <div class="resize"></div>
        <div id="main_balance" data-rel="balance"><?= sprintf('%.2f', floor((float)$_SESSION['user']['balance'] * 100) / 100); ?></div>
        <div id="main_currency" data-rel="currency"><?= CURRENCY; ?></div> 
        <button id="sound_switcher"></button>
        <?php if( 2 == 3 ){ ?>
            <label id="burger" for=""><img src="res/img/burger.svg" alt="BurgerMenuButton"></label>
        <?php } ?>
    </header>

    <main id="main"> 
        <div id="bets_wrapper">
            <ul class="base_menu"> 
                <li class="active" data-rel="bets"><?= TEXT_BETS_MENU_BTN_ALL; ?></li> 
                <li data-rel="prev"><?= TEXT_BETS_MENU_BTN_PREV; ?></li> 
                <li data-rel="hist"><?= TEXT_BETS_MENU_BTN_HISTORY; ?></li> 
            </ul>
            <div class="info_window"> 
                <div class="spoiler" data-rel="bets"> 
                    <h3>
                        <img src="res/img/users/av-10.png" alt="">
                        <img src="res/img/users/av-11.png" alt="">
                        <img src="res/img/users/av-12.png" alt="">
                        <div class="label">0</div>
                    </h3>
                    <h3>
                        <div class="cur">0</div>
                        <span>/</span>
                        <div class="total">0</div>
                        <div class="units"><?= TEXT_BETS_MENU_BETS; ?></div>
                        <div class="currency_line"><?= TEXT_BETS_MENU_TOTAL_WIN; ?> <div class="currency" data-rel="currency"><?= CURRENCY; ?></div></div>
                    </h3>
                    <div class="progress"><div class="progresser" data-freq="100"></div></div>
                </div>
                <div class="spoiler" data-rel="prev">
                    <h3><?= TEXT_BETS_MENU_RESULT; ?></h3>
                    <h4 id="last_cf">0</h4>
                </div>
                <div class="spoiler" data-rel="hist">
                    <h3><?= TEXT_BETS_MENU_HISTORY; ?></h3>
                </div>
            </div>
            <h2>
                <div><?= TEXT_BETS_MENU_PLAYER; ?></div> 
                <div><?= TEXT_BETS_MENU_BET; ?> <span data-rel="currency"><?= CURRENCY; ?></span></div> 
                <div>X</div> 
                <div><?= TEXT_BETS_MENU_WIN; ?> <span data-rel="currency"><?= CURRENCY; ?></span></div>
            </h2>
            <div class="resize" style="position:relative;">
                <div id="current_bets_list" class="bets_list" data-rel="bets"><ul></ul></div>
                <div id="previous_bets_list" class="bets_list" data-rel="prev"><ul></ul></div>
                <div id="my_bets_list" class="bets_list" data-rel="hist"><ul></ul></div>
            </div>
            <div class="footer">
                <a href="/" class="copyrights">
                    <img src="res/img/pf-icon.svg" alt="">
                    <span><?= TEXT_BETS_MENU_COPYRIGHTS; ?></span>
                </a>
                <div class="resize"></div>
                <a href="/" class="pwered">
                    <span><?= TEXT_BETS_MENU_POWERED; ?></span>
                    <img src="res/img/logo-icon.svg" alt="">
                </a>
            </div>
        </div>

        <div id="game_container"> 
            <div id="history_wrapper">
                <input type="checkbox" id="expand_history_wrapper" autocomplete="off">
                <div class="wrapper">
                    <h2><?= TEXT_GAMEFIELD_HISTORY; ?></h2>
                    <div class="inner"></div>
                </div>
                <label id="collapse_history" for="expand_history_wrapper"><img src="res/img/x.svg" alt=""></label>
                <label id="expand_history" for="expand_history_wrapper"><img src="res/img/show-more-icon.svg" alt=""></label>
            </div>
            <div id="game_field">
                <div class="body">
                    <canvas id="canvas"></canvas>
                    <?php if( !$_SESSION['user']['host_id'] ){ ?>
                        <div class="header"><?= TEXT_GAMEFIELD_DEMO_MODE; ?></div>
                    <?php } ?>
                    <div id="loading_level">
                        <div class="inner">
                            <img src="res/img/partners-logo.svg" alt="">
                            <div class="progress"><div class="progresser" data-freq="100"></div></div>
                            <img src="res/img/official.svg" alt="">
                        </div>
                    </div>
                    <div id="process_level">
                        <div class="inner">
                            <div class="current" data-amount="1">1.0x</div>
                        </div>
                    </div>
                    <div id="complete_level">
                        <div class="inner">
                            <div class="caption"><?= TEXT_GAMEFIELD_FINISH; ?></div>
                            <div class="result">1.0x</div>
                        </div>
                    </div>
                    <div id="game_bets">
                        <img src="res/img/users/av-10.png" alt="">
                        <img src="res/img/users/av-11.png" alt="">
                        <img src="res/img/users/av-12.png" alt="">
                        <div class="label">0</div>
                    </div>
                </div>
            </div>
            <div id="actions_wrapper"> 
                <input type="checkbox" id="actions_wrapper_switcher" name="actions_wrapper_switcher" autocomplete="off">
                <div class="actions_field" data-id="1">
                    <div class="header">
                        <div class="bounder">
                            <ul class="base_menu">
                                <li class="active" data-id="1"><?= TEXT_GAMEFIELD_ACTIONS_BTN_BET; ?></li> 
                                <li data-rel="autobet"><?= TEXT_GAMEFIELD_ACTIONS_BTN_AUTO; ?></li> 
                            </ul>
                            <label for="actions_wrapper_switcher">
                                <img src="res/img/remove.svg" alt="">
                                <img src="res/img/plus.svg" alt="">
                            </label>
                        </div>
                    </div>
                    <div class="body">
                        <div class="bounder">
                            <div class="left">
                                <div class="ranger"> 
                                    <button data-dir="minus"><img src="res/img/minus-grey.svg" alt=""></button>
                                    <div class="input"><input type="text" value="0.5" autocomplete="off"></div>
                                    <button data-dir="plus"><img src="res/img/plus-grey.svg" alt=""></button>
                                </div>
                                <div class="line">
                                    <button class="fast_bet">2.00</button>
                                    <button class="fast_bet">5.00</button>
                                </div>
                                <div class="line">
                                    <button class="fast_bet">10.00</button>
                                    <button class="fast_bet">50.00</button>
                                </div>
                            </div>
                            <div class="right">
                                <button class="make_bet" data-id="" data-src="1">
                                    <span><?= TEXT_GAMEFIELD_MAKE_BET; ?></span>
                                    <h2><div data-rel="current_bet">0.5</div> <div data-rel="currency"><?= CURRENCY; ?></div></h2>
                                    <h3><?= TEXT_GAMEFIELD_NEXT_ROUND; ?></h3>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class="bounder">
                            <button class="autoplay" data-id="1"><?= TEXT_GAMEFIELD_AUTOBET_AUTOPLAY; ?></button>
                            <div class="resize"></div>
                            <div class="auto_cash"><?= TEXT_GAMEFIELD_ACTIONS_BTN_CASHOUT; ?></div>
                            <label class="auto_out_switcher">
                                <input type="checkbox" autocomplete="off" name="cashout_switcher" data-id="1" data-src="1">
                                <div></div>
                            </label>
                            <div class="auto_out">
                                <input type="text" name="cashout_value" data-id="1"  value="1" autocomplete="off">
                                <img src="res/img/x.svg" alt="">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="actions_field" data-id="2"> 
                    <div class="header">
                        <div class="bounder">
                            <ul class="base_menu">
                                <li class="active" data-id="2"><?= TEXT_GAMEFIELD_ACTIONS_BTN_BET; ?></li> 
                                <li data-rel="autobet"><?= TEXT_GAMEFIELD_ACTIONS_BTN_AUTO; ?></li>
                            </ul>
                        </div>
                    </div>
                    <div class="body">
                        <div class="bounder">
                            <div class="left">
                                <div class="ranger">
                                    <button data-dir="minus"><img src="res/img/minus-grey.svg" alt=""></button>
                                    <div class="input"><input type="text" value="0.5" autocomplete="off"></div>
                                    <button data-dir="plus"><img src="res/img/plus-grey.svg" alt=""></button>
                                </div>
                                <div class="line">
                                    <button class="fast_bet">2.00</button>
                                    <button class="fast_bet">5.00</button>
                                </div>
                                <div class="line">
                                    <button class="fast_bet">10.00</button>
                                    <button class="fast_bet">50.00</button>
                                </div>
                            </div>
                            <div class="right">
                                <button class="make_bet" data-id="" data-src="2"> 
                                    <span><?= TEXT_GAMEFIELD_MAKE_BET; ?></span>
                                    <h2><div data-rel="current_bet">0.5</div> <div data-rel="currency"><?= CURRENCY; ?></div></h2>
                                    <h3><?= TEXT_GAMEFIELD_NEXT_ROUND; ?></h3>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <div class="bounder">
                            <button class="autoplay" data-id="2"><?= TEXT_GAMEFIELD_AUTOBET_AUTOPLAY; ?></button>
                            <div class="resize"></div>
                            <div class="auto_cash"><?= TEXT_GAMEFIELD_ACTIONS_BTN_CASHOUT; ?></div> 
                            <label class="auto_out_switcher">
                                <input type="checkbox" name="cashout_switcher" autocomplete="off" data-id="2" data-src="2">
                                <div></div>
                            </label>
                            <div class="auto_out">
                                <input type="text" name="cashout_value" data-id="2" value="1" autocomplete="off">
                                <img src="res/img/x.svg" alt="">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div id="modal_wrapper">
        <div class="alert-win celebrated">
            <div class="multiplier">
                <div class="label"><?= TEXT_WIN_MODAL_HEADER; ?></div>
                <div class="value">1.0x</div>
            </div>
            <div class="win celebrated">
                <div class="label no-wrap">
                    <span><?= TEXT_WIN_MODAL_WIN; ?></span>
                    <span class="currency" data-rel="currency"> <?= CURRENCY; ?></span>
                </div>
                <div class="value"><span>0.0</span></div>
            </div>
            <button class="close"><span>×</span></button>
        </div>
    </div>

    <div class="modal" id="autoplay_modal"> 
        <div class="modal-content">
            <div class="modal-header">
                <span><?= TEXT_AUTOPLAY_MODAL_HEADER; ?></span>
                <button class="close">+</button>
            </div>
            <div class="modal-body">
                <div class="content-part content-part-1">
                    <span><?= TEXT_AUTOPLAY_MODAL_ROUNDS; ?></span>
                    <div class="rounds-wrap"> 
                        <label> <input type="radio" name="numrounds" value="10"> <div>10</div> </label>
                        <label> <input type="radio" name="numrounds" value="20"> <div>20</div> </label>
                        <label> <input type="radio" name="numrounds" value="50"> <div>50</div> </label>
                        <label> <input type="radio" name="numrounds" value="100"> <div>100</div> </label>
                    </div>
                </div>
                <div class="content-part switchers">
                    <label class="input-switch">
                        <input type="checkbox" name="isdecreases" value="" autocomplete="off">
                        <div></div>
                    </label>
                    <span class="labels"><?= TEXT_AUTOPLAY_MODAL_DECREASE; ?></span>
                    <div class="resize"></div>
                    <div class="ranger sized">
                        <button data-dir="minus"><img src="res/img/minus-grey.svg" alt=""></button>
                        <div class="input"><input type="text" value="0" name="decreases" autocomplete="off"></div>
                        <button data-dir="plus"><img src="res/img/plus-grey.svg" alt=""></button>
                    </div>
                    <span class="labels"> <?= CURRENCY; ?> </span>
                </div>
                <div class="content-part switchers">
                    <label class="input-switch">
                        <input type="checkbox" name="isincreases" value="" autocomplete="off">
                        <div></div>
                    </label>
                    <span class="labels"><?= TEXT_AUTOPLAY_MODAL_INCREASE; ?></span>
                    <div class="resize"></div>
                    <div class="ranger sized">
                        <button data-dir="minus"><img src="res/img/minus-grey.svg" alt=""></button>
                        <div class="input"><input type="text" value="0" name="increases" autocomplete="off"></div>
                        <button data-dir="plus"><img src="res/img/plus-grey.svg" alt=""></button>
                    </div>
                    <span class="labels"> <?= CURRENCY; ?> </span>
                </div>
                <div class="content-part switchers">
                    <label class="input-switch">
                        <input type="checkbox" name="iswins" value="" autocomplete="off">
                        <div></div>
                    </label>
                    <span class="labels"><?= TEXT_AUTOPLAY_MODAL_ESCEED; ?></span>
                    <div class="resize"></div>
                    <div class="ranger sized">
                        <button data-dir="minus"><img src="res/img/minus-grey.svg" alt=""></button>
                        <div class="input"><input type="text" value="0" name="wins" autocomplete="off"></div>
                        <button data-dir="plus"><img src="res/img/plus-grey.svg" alt=""></button>
                    </div>
                    <span class="labels"> <?= CURRENCY; ?> </span>
                </div>
            </div>
            <div class="modal-footer">
                <div class="btns-wrapper">
                    <button class="btn-warning" id="reset_autoplay"><?= TEXT_AUTOPLAY_MODAL_BTN_RESET; ?></button>
                    <button class="btn-success" id="save_autoplay"><?= TEXT_AUTOPLAY_MODAL_BTN_START; ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
<script>
    LOCALIZATION = {
        make_bet_generic_bet: '<?= TEXT_GAMEFIELD_MAKE_BET; ?>', 
        make_bet_generic_cancel: '<?= TEXT_GAMEFIELD_MAKE_CANCEL; ?>', 
        make_bet_generic_cashout: '<?= TEXT_GAMEFIELD_MAKE_CASHOUT; ?>', 
        autobet_generic_autoplay: '<?= TEXT_GAMEFIELD_AUTOBET_AUTOPLAY; ?>', 
        autobet_generic_stop: '<?= TEXT_GAMEFIELD_AUTOBET_STOP; ?>'
    }
</script>
<!-- Splash screen removed -->
<script src="res/js/game.js?<?= rand(0,999999); ?>"></script>