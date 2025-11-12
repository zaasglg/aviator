<?php
/**
 * Конфигурация демо счетов для разных стран
 */

$demo_configs = [
    'Colombia' => [
        'currency' => 'COP',
        'balance' => 250000,
        'quick_bets' => [2500, 5000, 10000, 35000],
        'min_bet' => 100,
        'max_bet' => 70000,
        'default_bet' => 2500
    ],
    'Paraguay' => [
        'currency' => 'PYG',
        'balance' => 5000000,
        'quick_bets' => [50000, 100000, 200000, 700000],
        'min_bet' => 1000,
        'max_bet' => 1500000,
        'default_bet' => 50000
    ],
    'Ecuador' => [
        'currency' => 'USD',
        'balance' => 500,
        'quick_bets' => [0.5, 1, 2, 7],
        'min_bet' => 0.5,
        'max_bet' => 150,
        'default_bet' => 0.5
    ],
    'Brazil' => [
        'currency' => 'BRL',
        'balance' => 2000,
        'quick_bets' => [20, 50, 100, 350],
        'min_bet' => 10,
        'max_bet' => 1000,
        'default_bet' => 20
    ],
    'Argentina' => [
        'currency' => 'ARS',
        'balance' => 15000,
        'quick_bets' => [150, 300, 600, 2100],
        'min_bet' => 50,
        'max_bet' => 5000,
        'default_bet' => 150
    ],
    'Mexico' => [
        'currency' => 'MXN',
        'balance' => 10000,
        'quick_bets' => [100, 200, 400, 1400],
        'min_bet' => 50,
        'max_bet' => 3000,
        'default_bet' => 100
    ],
    'Peru' => [
        'currency' => 'PEN',
        'balance' => 2000,
        'quick_bets' => [20, 50, 100, 350],
        'min_bet' => 10,
        'max_bet' => 1000,
        'default_bet' => 20
    ],
    'Chile' => [
        'currency' => 'CLP',
        'balance' => 500000,
        'quick_bets' => [5000, 10000, 20000, 70000],
        'min_bet' => 1000,
        'max_bet' => 200000,
        'default_bet' => 5000
    ],
    'Uruguay' => [
        'currency' => 'UYU',
        'balance' => 20000,
        'quick_bets' => [200, 400, 800, 2800],
        'min_bet' => 100,
        'max_bet' => 10000,
        'default_bet' => 200
    ],
    'Bolivia' => [
        'currency' => 'BOB',
        'balance' => 3500,
        'quick_bets' => [35, 70, 140, 490],
        'min_bet' => 10,
        'max_bet' => 2000,
        'default_bet' => 35
    ],
    'Venezuela' => [
        'currency' => 'VES',
        'balance' => 5000000,
        'quick_bets' => [50000, 100000, 200000, 700000],
        'min_bet' => 10000,
        'max_bet' => 2000000,
        'default_bet' => 50000
    ],
    'Guyana' => [
        'currency' => 'GYD',
        'balance' => 100000,
        'quick_bets' => [1000, 2000, 4000, 14000],
        'min_bet' => 500,
        'max_bet' => 50000,
        'default_bet' => 1000
    ],
    'Suriname' => [
        'currency' => 'SRD',
        'balance' => 200000,
        'quick_bets' => [2000, 4000, 8000, 28000],
        'min_bet' => 1000,
        'max_bet' => 100000,
        'default_bet' => 2000
    ],
    'default' => [
        'currency' => 'USD',
        'balance' => 500,
        'quick_bets' => [0.5, 1, 2, 7],
        'min_bet' => 0.5,
        'max_bet' => 150,
        'default_bet' => 0.5
    ]
];

return $demo_configs;
