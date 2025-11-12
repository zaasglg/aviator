# API Integration для Aviator Game

## Обзор

Игра интегрирована с API для получения и обновления данных игрока в реальном времени.

## Схема работы

```
1. Игра загружается с access_token в URL
   ↓
2. Token сохраняется в window.ACCESS_TOKEN
   ↓
3. При инициализации вызывается fetchUserInfo()
   ↓
4. API возвращает: баланс, страну, валюту, user_id
   ↓
5. Игрок играет
   ↓
6. После каждой игры вызывается updateBalance()
   ↓
7. API обновляет баланс на сервере
   ↓
8. Баланс синхронизируется с сервером
```

## API Endpoints

### 1. Получение информации о пользователе

**GET** `https://api.valor-games.co/api/user/info/`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response:**
```json
{
  "user_id": 123,
  "deposit": 500.00,
  "country": "Colombia",
  "country_info": {
    "currency": "COP"
  }
}
```

### 2. Обновление баланса

**PUT** `https://api.valor-games.co/api/user/deposit/`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "deposit": "450.50"
}
```

## Использование

### Demo режим
```
https://aviator.valor-games.co/?demo=true&country=Colombia
```
- Работает без API
- Использует локальный баланс из конфигурации

### Real режим
```
https://aviator.valor-games.co/?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Требует валидный JWT токен
- Синхронизирует баланс с сервером
- Получает страну и валюту из API

### Real режим с указанием страны
```
https://aviator.valor-games.co/?access_token=...&country=Colombia
```
- Использует указанную страну вместо данных из токена

## JavaScript API

### Глобальный объект
```javascript
window.$aviatorAPI
```

### Методы

#### fetchUserInfo()
Получает информацию о пользователе с сервера
```javascript
await window.$aviatorAPI.fetchUserInfo();
```

#### updateBalance(newBalance)
Обновляет баланс на сервере
```javascript
await window.$aviatorAPI.updateBalance(500.50);
```

#### sendGameResult(gameResult, betAmount, winAmount, finalBalance)
Отправляет результат игры на сервер
```javascript
await window.$aviatorAPI.sendGameResult('win', 10, 20, 510);
```

#### hasToken()
Проверяет наличие токена
```javascript
if (window.$aviatorAPI.hasToken()) {
    // Работаем с API
}
```

## Безопасность

- Токен передается в заголовке `Authorization: Bearer {token}`
- Без токена API запросы не выполняются (игра работает в демо-режиме)
- При ошибке 401 - токен недействителен или истек
- Токен хранится в сессии и не доступен из внешних скриптов

## Автоматическая синхронизация

Баланс автоматически синхронизируется с сервером:
- При загрузке игры
- После каждого выигрыша (cashout)
- После завершения раунда
- При вызове метода `balance()`

## Обработка ошибок

При ошибке API:
- Игра продолжает работать локально
- Баланс не синхронизируется с сервером
- В консоли выводится сообщение об ошибке
- При 401 ошибке токен сбрасывается

## Файлы

- `res/js/api.js` - Класс для работы с API
- `templates/main.tpl.php` - Установка ACCESS_TOKEN
- `res/js/game.js` - Интеграция с API в игровой логике
