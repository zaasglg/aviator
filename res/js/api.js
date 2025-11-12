/**
 * API Integration для Aviator Game
 * Работа с балансом и данными пользователя через API
 */

class AviatorAPI {
    constructor() {
        this.apiUrl = 'https://api.valor-games.co/api';
        this.accessToken = window.ACCESS_TOKEN || null;
        this.userInfo = null;
    }

    /**
     * Получение информации о пользователе
     * GET /api/user/info/
     */
    async fetchUserInfo() {
        if (!this.accessToken) {
            console.log('No access token - working in demo mode');
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.accessToken
        };

        try {
            console.log('Fetching user info from API...');
            const response = await fetch(this.apiUrl + '/user/info/', {
                method: 'GET',
                headers: headers
            });

            if (response.status === 401) {
                console.error('Unauthorized - invalid or expired token');
                this.accessToken = null;
                return null;
            }

            if (!response.ok) {
                throw new Error('API request failed: ' + response.status);
            }

            const data = await response.json();
            console.log('User info received:', data);

            this.userInfo = data;

            // Обновляем данные пользователя
            if (data && window.$user) {
                // Обновляем баланс
                if (data.deposit !== undefined) {
                    window.$user.balance = parseFloat(data.deposit);
                    this.updateBalanceDisplay();
                    console.log('Balance updated from API:', window.$user.balance);
                }

                // Обновляем страну и валюту
                if (data.country) {
                    window.$user.country = data.country;
                    window.$user.user_id = data.user_id;
                    
                    if (data.country_info && data.country_info.currency) {
                        SETTINGS.currency = data.country_info.currency;
                        window.$user.currency = data.country_info.currency;
                        
                        // Обновляем атрибут body
                        $('body').attr('data-currency', data.country_info.currency);
                        
                        // Обновляем отображение валюты в интерфейсе
                        $('[data-rel="currency"]').html(data.country_info.currency).text(data.country_info.currency);
                        
                        console.log('Currency updated:', SETTINGS.currency);
                    }
                }

                // Обновляем конфигурацию игры для страны
                if (data.country && window.$game_config) {
                    this.updateGameConfigForCountry(data.country);
                }
            }

            return data;
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }

    /**
     * Обновление баланса на сервере
     * PUT /api/user/deposit/
     */
    async updateBalance(newBalance) {
        if (!this.accessToken) {
            console.log('No access token - balance not synced to server');
            return false;
        }

        const headers = {
            'Authorization': 'Bearer ' + this.accessToken,
            'Content-Type': 'application/json'
        };

        const requestData = {
            deposit: parseFloat(newBalance).toFixed(2)
        };

        try {
            console.log('Updating balance on server:', requestData);
            const response = await fetch(this.apiUrl + '/user/deposit/', {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            if (response.status === 401) {
                console.error('Unauthorized - invalid or expired token');
                this.accessToken = null;
                return false;
            }

            if (!response.ok) {
                throw new Error('API request failed: ' + response.status);
            }

            const data = await response.json();
            console.log('Balance updated on server:', data);
            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    }

    /**
     * Отправка результатов игры на сервер
     */
    async sendGameResult(gameResult, betAmount, winAmount, finalBalance) {
        console.log('Sending game result:', {
            gameResult: gameResult,
            betAmount: betAmount,
            winAmount: winAmount,
            finalBalance: finalBalance
        });

        // Обновляем баланс на сервере
        const success = await this.updateBalance(finalBalance);

        if (success) {
            // Синхронизируем данные с сервером
            await this.fetchUserInfo();
        }

        return success;
    }

    /**
     * Обновление отображения баланса в интерфейсе
     */
    updateBalanceDisplay() {
        if (window.$user && window.$user.balance !== undefined) {
            const balance = parseFloat(window.$user.balance);
            const displayBalance = balance.toFixed(2);
            
            $('[data-rel="balance"]').each(function() {
                $(this).val(displayBalance).html(displayBalance).text(displayBalance);
            });
            
            $('#main_balance').html(displayBalance);
            console.log('Balance display updated:', displayBalance);
        }
    }

    /**
     * Обновление конфигурации игры для страны
     */
    updateGameConfigForCountry(country) {
        console.log('Updating game config for country:', country);
        
        // Конфигурации для разных стран
        const countryConfigs = {
            'Colombia': { currency: 'COP', quick_bets: [2500, 5000, 10000, 35000], default_bet: 2500 },
            'Paraguay': { currency: 'PYG', quick_bets: [50000, 100000, 200000, 700000], default_bet: 50000 },
            'Ecuador': { currency: 'USD', quick_bets: [0.5, 1, 2, 7], default_bet: 0.5 },
            'Brazil': { currency: 'BRL', quick_bets: [20, 50, 100, 350], default_bet: 20 },
            'Argentina': { currency: 'ARS', quick_bets: [150, 300, 600, 2100], default_bet: 150 },
            'Mexico': { currency: 'MXN', quick_bets: [100, 200, 400, 1400], default_bet: 100 },
            'Peru': { currency: 'PEN', quick_bets: [20, 50, 100, 350], default_bet: 20 },
            'Chile': { currency: 'CLP', quick_bets: [5000, 10000, 20000, 70000], default_bet: 5000 },
            'Uruguay': { currency: 'UYU', quick_bets: [200, 400, 800, 2800], default_bet: 200 },
            'Bolivia': { currency: 'BOB', quick_bets: [35, 70, 140, 490], default_bet: 35 },
            'Venezuela': { currency: 'VES', quick_bets: [50000, 100000, 200000, 700000], default_bet: 50000 }
        };
        
        const config = countryConfigs[country] || countryConfigs['Ecuador'];
        
        if (config) {
            // Обновляем quick_bets кнопки
            $('.fast_bet').each(function(index) {
                if (config.quick_bets[index] !== undefined) {
                    $(this).text(config.quick_bets[index].toFixed(2));
                }
            });
            
            // Обновляем default_bet в полях ввода
            $('.actions_field .ranger input[type="text"]').val(config.default_bet);
            
            // Обновляем валюту
            if (config.currency) {
                SETTINGS.currency = config.currency;
                $('body').attr('data-currency', config.currency);
                $('[data-rel="currency"]').html(config.currency).text(config.currency);
            }
            
            console.log('Game config updated:', config);
        }
    }

    /**
     * Проверка наличия токена
     */
    hasToken() {
        return this.accessToken !== null;
    }

    /**
     * Получение информации о пользователе (кэшированная)
     */
    getUserInfo() {
        return this.userInfo;
    }
}

// Создаем глобальный экземпляр API
window.$aviatorAPI = new AviatorAPI();

// Инициализация при загрузке страницы
$(document).ready(async function() {
    console.log('Initializing Aviator API...');
    
    // Если есть токен, загружаем данные пользователя
    if (window.$aviatorAPI.hasToken()) {
        console.log('Access token found, fetching user info...');
        await window.$aviatorAPI.fetchUserInfo();
    } else {
        console.log('No access token - working in demo mode');
    }
});
