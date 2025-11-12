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
            
            // Get access token from URL
            this.accessToken = urlParams.get('access_token');
            
            // Determine if real mode
            const mode = urlParams.get('mode');
            this.isRealMode = mode === 'real' && this.accessToken;
            
            // Store token globally
            if (this.accessToken) {
                window.ACCESS_TOKEN = this.accessToken;
            }
            
            console.log('API initialized:', {
                hasToken: !!this.accessToken,
                isRealMode: this.isRealMode
            });
            
            // Fetch initial user info if in real mode
            if (this.isRealMode) {
                this.fetchUserInfo();
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
                    
                    // Update global user balance
                    if (window.$user) {
                        window.$user.balance = apiBalance;
                    }
                    
                    // Update balance display
                    this.updateBalanceDisplay(apiBalance);
                    
                    console.log('Balance updated from API:', apiBalance);
                }

                // Update currency if available
                if (data.country_info && data.country_info.currency) {
                    this.updateCurrency(data.country_info.currency);
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
            
            // Update all balance elements
            $('[data-rel="balance"]').each(function() {
                $(this).val(formattedBalance).html(formattedBalance).text(formattedBalance);
            });
            
            $('#main_balance').html(formattedBalance);
            
            console.log('Balance display updated:', formattedBalance);
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
