/**
 * Aviator Game API Integration
 * Handles communication with valor-games.co API for real mode
 */

(function() {
    'use strict';

    // API Configuration
    const API_BASE_URL = 'https://api.valor-games.co/api';
    const API_ENDPOINTS = {
        USER_INFO: '/user/info/',
        USER_DEPOSIT: '/user/deposit/',
        USER_LOOKUP: '/user/lookup/'
    };

    /**
     * Aviator API Class
     */
    class AviatorAPI {
        constructor() {
            this.accessToken = null;
            this.isRealMode = false;
            this.lastBalanceUpdate = 0;
            this.balanceUpdateThrottle = 1000; // Минимум 1 секунда между обновлениями
            
            // Initialize from URL parameters
            this.init();
        }

        /**
         * Initialize API from URL parameters
         */
        init() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Get access token from URL or from window
            this.accessToken = urlParams.get('access_token') || window.ACCESS_TOKEN;
            
            // Если есть токен - это реальный режим
            this.isRealMode = !!this.accessToken;
            
            // Store token globally
            if (this.accessToken) {
                window.ACCESS_TOKEN = this.accessToken;
            }
            
            console.log('API initialized:', {
                hasToken: !!this.accessToken,
                isRealMode: this.isRealMode,
                token: this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'none'
            });
            
            // Fetch initial user info if in real mode
            if (this.isRealMode) {
                console.log('🔄 Real mode detected - will fetch user info');
                
                // Wait for DOM to be ready
                const fetchUserData = () => {
                    console.log('🔄 Fetching user info from API...');
                    this.fetchUserInfo().then(userInfo => {
                        if (userInfo) {
                            console.log('✅ User info loaded successfully:', userInfo);
                        } else {
                            console.error('❌ Failed to load user info');
                        }
                    });
                };
                
                // If document is already loaded, fetch immediately
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    fetchUserData();
                } else {
                    // Otherwise wait for DOM to load
                    document.addEventListener('DOMContentLoaded', fetchUserData);
                }
            } else {
                console.log('ℹ️ Demo mode - API disabled');
            }
        }

        /**
         * Check if API has valid token
         */
        hasToken() {
            return !!this.accessToken && this.isRealMode;
        }

        /**
         * Get authorization headers
         */
        getHeaders() {
            return {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken
            };
        }

        /**
         * Fetch user information from API
         * GET /api/user/info/
         */
        async fetchUserInfo() {
            if (!this.hasToken()) {
                console.log('No access token - cannot fetch user info');
                return null;
            }

            try {
                console.log('Fetching user info from API...');
                
                const response = await fetch(API_BASE_URL + API_ENDPOINTS.USER_INFO, {
                    method: 'GET',
                    headers: this.getHeaders()
                });

                if (!response.ok) {
                    throw new Error('API response was not ok: ' + response.status);
                }

                const data = await response.json();
                console.log('User info response:', data);

                // Update balance from API
                if (data && data.deposit !== undefined) {
                    const apiBalance = parseFloat(data.deposit);
                    
                    console.log('💰 API Balance received:', apiBalance);
                    console.log('💰 Current $user.balance:', window.$user ? window.$user.balance : 'undefined');
                    
                    // Update global user balance
                    if (window.$user) {
                        window.$user.balance = apiBalance;
                        console.log('💰 Updated $user.balance to:', window.$user.balance);
                    } else {
                        console.error('❌ window.$user is not defined!');
                    }
                    
                    // Update balance display
                    this.updateBalanceDisplay(apiBalance);
                    
                    console.log('✅ Balance updated from API:', apiBalance);
                } else {
                    console.warn('⚠️ No deposit field in API response:', data);
                }

                // Update currency and country settings
                if (data.country_info) {
                    if (data.country_info.currency) {
                        this.updateCurrency(data.country_info.currency);
                    }
                    
                    // Update country-specific settings (quick_bets, min/max bet, etc.)
                    if (data.country) {
                        this.updateCountrySettings(data.country, data.country_info.currency);
                    }
                }

                // Store user ID
                if (data.user_id) {
                    if (window.$user) {
                        window.$user.host_id = data.user_id;
                    }
                }

                return data;

            } catch (error) {
                console.error('Failed to fetch user info:', error);
                
                // Handle specific errors
                if (error.message.includes('401')) {
                    console.error('Authentication error - invalid token');
                } else if (error.message.includes('Load failed') || error.message.includes('CORS')) {
                    console.error('CORS or network error');
                }
                
                return null;
            }
        }

        /**
         * Send game result to API (WIN or LOSS)
         * PUT /api/user/deposit/
         * 
         * @param {string} gameResult - 'win' or 'loss'
         * @param {number} betAmount - Amount of bet
         * @param {number} winAmount - Amount won (0 for loss)
         * @param {number} finalBalance - Final balance after game
         */
        async sendGameResult(gameResult, betAmount, winAmount, finalBalance) {
            if (!this.hasToken()) {
                console.log('No access token - skipping API call');
                return null;
            }

            // Throttle balance updates
            const now = Date.now();
            if (now - this.lastBalanceUpdate < this.balanceUpdateThrottle) {
                console.log('Throttling balance update');
                return null;
            }
            this.lastBalanceUpdate = now;

            try {
                const requestData = {
                    deposit: parseFloat(finalBalance).toFixed(2)
                };

                console.log('Sending game result to API:', {
                    result: gameResult,
                    bet: betAmount,
                    win: winAmount,
                    finalBalance: finalBalance,
                    data: requestData
                });

                const response = await fetch(API_BASE_URL + API_ENDPOINTS.USER_DEPOSIT, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(requestData)
                });

                console.log('API response status:', response.status);

                if (!response.ok) {
                    throw new Error('API response was not ok: ' + response.status);
                }

                const data = await response.json();
                console.log('API response data:', data);

                // Update balance from API response
                if (data && data.balance !== undefined) {
                    const apiBalance = parseFloat(data.balance);
                    
                    if (window.$user) {
                        window.$user.balance = apiBalance;
                    }
                    
                    this.updateBalanceDisplay(apiBalance);
                    console.log('Balance updated from API response:', apiBalance);
                    
                } else if (data && data.new_deposit !== undefined) {
                    const apiBalance = parseFloat(data.new_deposit);
                    
                    if (window.$user) {
                        window.$user.balance = apiBalance;
                    }
                    
                    this.updateBalanceDisplay(apiBalance);
                    console.log('Balance updated from API response (new_deposit):', apiBalance);
                }

                // Fetch fresh user info after game
                setTimeout(() => {
                    this.fetchUserInfo().then(userInfo => {
                        if (userInfo && window.parent && window.parent !== window) {
                            // Send message to parent window
                            window.parent.postMessage({
                                type: 'balanceUpdated',
                                balance: window.$user ? window.$user.balance : 0,
                                userId: userInfo.user_id
                            }, '*');
                        }
                    });
                }, 500);

                return data;

            } catch (error) {
                console.error('Failed to send game result to API:', error);
                
                // Handle specific errors
                if (error.message.includes('401')) {
                    console.error('Authentication error - invalid token');
                } else if (error.message.includes('Load failed') || error.message.includes('CORS')) {
                    console.error('CORS or network error');
                }
                
                // Update display even on error
                this.updateBalanceDisplay(finalBalance);
                
                return null;
            }
        }

        /**
         * Update balance (simplified version for sync)
         */
        async updateBalance(balance) {
            return this.sendGameResult('sync', 0, 0, balance);
        }

        /**
         * Update balance display in UI
         */
        updateBalanceDisplay(balance) {
            const formattedBalance = parseFloat(balance).toFixed(2);
            
            console.log('🎨 Updating balance display to:', formattedBalance);
            
            // Check if jQuery is available
            if (typeof $ === 'undefined') {
                console.error('❌ jQuery is not loaded yet!');
                // Retry after a short delay
                setTimeout(() => this.updateBalanceDisplay(balance), 100);
                return;
            }
            
            // Update all balance elements
            const balanceElements = $('[data-rel="balance"]');
            console.log('🎨 Found', balanceElements.length, 'balance elements');
            
            balanceElements.each(function() {
                $(this).val(formattedBalance).html(formattedBalance).text(formattedBalance);
            });
            
            const mainBalance = $('#main_balance');
            console.log('🎨 Main balance element:', mainBalance.length > 0 ? 'found' : 'not found');
            mainBalance.html(formattedBalance);
            
            console.log('✅ Balance display updated to:', formattedBalance);
        }

        /**
         * Update currency in UI
         */
        updateCurrency(currency) {
            if (!currency) return;
            
            console.log('Updating currency to:', currency);
            
            // Update global settings
            if (window.SETTINGS) {
                window.SETTINGS.currency = currency;
            }
            
            if (window.GAME_CONFIG) {
                window.GAME_CONFIG.currency_symbol = currency;
            }
            
            // Update currency display elements
            $('[data-rel="currency"]').each(function() {
                $(this).html(currency).val(currency).text(currency);
            });
            
            // Update SVG currency symbols
            $('svg use').each(function() {
                const href = $(this).attr('xlink:href');
                if (href && href.includes('currency.svg')) {
                    $(this).attr('xlink:href', './res/img/currency.svg#' + currency);
                }
            });
        }

        /**
         * Update country-specific settings (quick_bets, min/max bet, etc.)
         */
        updateCountrySettings(country, currency) {
            console.log('🌍 Updating country settings for:', country, currency);
            
            // Country configurations matching demo_config.php
            const countryConfigs = {
                'Colombia': {
                    currency: 'COP',
                    quick_bets: [2500, 5000, 10000, 35000],
                    min_bet: 100,
                    max_bet: 70000,
                    default_bet: 2500
                },
                'Paraguay': {
                    currency: 'PYG',
                    quick_bets: [50000, 100000, 200000, 700000],
                    min_bet: 1000,
                    max_bet: 1500000,
                    default_bet: 50000
                },
                'Ecuador': {
                    currency: 'USD',
                    quick_bets: [0.5, 1, 2, 7],
                    min_bet: 0.5,
                    max_bet: 150,
                    default_bet: 0.5
                },
                'Brazil': {
                    currency: 'BRL',
                    quick_bets: [20, 50, 100, 350],
                    min_bet: 10,
                    max_bet: 1000,
                    default_bet: 20
                },
                'Argentina': {
                    currency: 'ARS',
                    quick_bets: [150, 300, 600, 2100],
                    min_bet: 50,
                    max_bet: 5000,
                    default_bet: 150
                },
                'Mexico': {
                    currency: 'MXN',
                    quick_bets: [100, 200, 400, 1400],
                    min_bet: 50,
                    max_bet: 3000,
                    default_bet: 100
                },
                'Peru': {
                    currency: 'PEN',
                    quick_bets: [20, 50, 100, 350],
                    min_bet: 10,
                    max_bet: 1000,
                    default_bet: 20
                },
                'Chile': {
                    currency: 'CLP',
                    quick_bets: [5000, 10000, 20000, 70000],
                    min_bet: 1000,
                    max_bet: 200000,
                    default_bet: 5000
                },
                'Uruguay': {
                    currency: 'UYU',
                    quick_bets: [200, 400, 800, 2800],
                    min_bet: 100,
                    max_bet: 10000,
                    default_bet: 200
                },
                'Bolivia': {
                    currency: 'BOB',
                    quick_bets: [35, 70, 140, 490],
                    min_bet: 10,
                    max_bet: 2000,
                    default_bet: 35
                },
                'Venezuela': {
                    currency: 'VES',
                    quick_bets: [50000, 100000, 200000, 700000],
                    min_bet: 10000,
                    max_bet: 2000000,
                    default_bet: 50000
                },
                'Guyana': {
                    currency: 'GYD',
                    quick_bets: [1000, 2000, 4000, 14000],
                    min_bet: 500,
                    max_bet: 50000,
                    default_bet: 1000
                },
                'Suriname': {
                    currency: 'SRD',
                    quick_bets: [2000, 4000, 8000, 28000],
                    min_bet: 1000,
                    max_bet: 100000,
                    default_bet: 2000
                },
                'Kenya': {
                    currency: 'KES',
                    quick_bets: [150, 300, 1000, 5000],
                    min_bet: 500,
                    max_bet: 10000,
                    default_bet: 150
                },
                'Nigeria': {
                    currency: 'NGN',
                    quick_bets: [1500, 3000, 10000, 20000],
                    min_bet: 1500,
                    max_bet: 50000,
                    default_bet: 1500
                },
                'Zimbabwe': {
                    currency: 'ZWL',
                    quick_bets: [500, 1000, 5000, 10000],
                    min_bet: 500,
                    max_bet: 100000,
                    default_bet: 500
                },
                'default': {
                    currency: 'USD',
                    quick_bets: [0.5, 1, 2, 7],
                    min_bet: 0.5,
                    max_bet: 150,
                    default_bet: 0.5
                }
            };
            
            // Get config for country or use default
            const config = countryConfigs[country] || countryConfigs['default'];
            
            console.log('🌍 Country config:', config);
            
            // Update quick bet buttons
            const quickBets = config.quick_bets;
            $('.actions_field').each(function() {
                const $field = $(this);
                const $buttons = $('.fast_bet', $field);
                
                console.log('🔘 Updating', $buttons.length, 'quick bet buttons');
                
                // Update buttons with new values
                // НЕ переназначаем обработчики - они уже установлены в game.js
                $buttons.each(function(index) {
                    if (index < quickBets.length) {
                        const value = quickBets[index];
                        const $btn = $(this);
                        
                        // Update button text
                        const displayValue = value < 1 ? value.toFixed(2) : value.toFixed(0);
                        $btn.text(displayValue);
                        
                        // Store value in data attribute for game.js handler
                        $btn.attr('data-bet-value', value);
                        
                        console.log('🔘 Button', index, 'set to:', value, 'display:', displayValue);
                    }
                });
                
                // Update default bet in input
                const $input = $('.ranger input[type="text"]', $field);
                $input.val(config.default_bet);
                
                // Update current bet display
                $('[data-rel="current_bet"]', $field).html(config.default_bet);
            });
            
            // Update global user settings
            if (window.$user) {
                window.$user.quick_bets = quickBets;
                window.$user.min_bet = config.min_bet;
                window.$user.max_bet = config.max_bet;
                window.$user.default_bet = config.default_bet;
                window.$user.country = country;
                
                console.log('✅ User settings updated:', window.$user);
            }
            
            // Update game config
            if (window.$game_config) {
                window.$game_config.quick_bets = quickBets;
                window.$game_config.min_bet = config.min_bet;
                window.$game_config.max_bet = config.max_bet;
                window.$game_config.default_bet = config.default_bet;
            }
            
            // Update game instance max_bet (ВАЖНО!)
            if (window.$game) {
                window.$game.max_bet = config.max_bet;
                console.log('✅ Game max_bet updated to:', config.max_bet);
            }
            
            console.log('✅ Country settings updated for', country);
        }

        /**
         * User lookup (for login)
         * GET /api/user/lookup/{user_id}/
         */
        async lookupUser(userId) {
            try {
                console.log('Looking up user:', userId);
                
                const response = await fetch(API_BASE_URL + API_ENDPOINTS.USER_LOOKUP + userId + '/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('API response was not ok: ' + response.status);
                }

                const data = await response.json();
                console.log('User lookup response:', data);

                return data;

            } catch (error) {
                console.error('Failed to lookup user:', error);
                return null;
            }
        }
    }

    // Create global API instance
    window.$aviatorAPI = new AviatorAPI();

    // Export for use in other scripts
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AviatorAPI;
    }

})();
