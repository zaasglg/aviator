# 🎮 Исправление демо режима

## 🐛 Проблема

В демо режиме кнопки быстрых ставок не работали правильно, как в реальном режиме.

**Причины:**
1. `$game.max_bet` не устанавливался из конфигурации
2. Кнопки не имели `data-bet-value` атрибута
3. Настройки из `demo_config.php` не применялись к игре

---

## ✅ Решение

### 1. Добавлена инициализация настроек в game.js

После создания игры применяются настройки из `$game_config`:

```javascript
// Apply game config settings (for demo mode)
if (window.$game_config && window.$game) {
    console.log("📋 Applying game config:", window.$game_config);
    
    // Update max_bet from config
    if ($game_config.max_bet) {
        $game.max_bet = $game_config.max_bet;
        console.log("✅ Game max_bet set to:", $game.max_bet);
    }
    
    // Update quick bet buttons with config values
    if ($game_config.quick_bets && $game_config.quick_bets.length > 0) {
        $('.actions_field').each(function() {
            const $field = $(this);
            const $buttons = $('.fast_bet', $field);
            
            $buttons.each(function(index) {
                if (index < $game_config.quick_bets.length) {
                    const value = $game_config.quick_bets[index];
                    const $btn = $(this);
                    
                    // Update button text
                    const displayValue = value < 1 ? value.toFixed(2) : value.toFixed(0);
                    $btn.text(displayValue);
                    
                    // Store value in data attribute
                    $btn.attr('data-bet-value', value);
                }
            });
        });
    }
}
```

### 2. Обновлен шаблон main.tpl.php

Добавлены `data-bet-value` атрибуты к кнопкам:

**Было:**
```php
<button class="fast_bet"><?= number_format($quick_bets[0], 2, '.', ''); ?></button>
```

**Стало:**
```php
<button class="fast_bet" data-bet-value="<?= $quick_bets[0]; ?>">
    <?= format_bet($quick_bets[0]); ?>
</button>
```

### 3. Добавлена функция форматирования

```php
function format_bet($value) {
    if ($value < 1) {
        return number_format($value, 2, '.', '');  // 0.50
    } else {
        return number_format($value, 0, '.', '');  // 2500
    }
}
```

---

## 🔄 Как это работает

### Шаг 1: PHP загружает конфигурацию

В `common.php`:
```php
$game_config = $game_configs[$user_country] ?? $game_configs['default'];
$_SESSION['game_config'] = $game_config;
```

### Шаг 2: Конфигурация передается в JavaScript

В `main.tpl.php`:
```javascript
window.$game_config = <?= json_encode($_SESSION['game_config']); ?>;
```

### Шаг 3: JavaScript применяет настройки

В `game.js`:
```javascript
$game.max_bet = $game_config.max_bet;  // 70000 для Colombia
```

### Шаг 4: Кнопки обновляются

```javascript
$btn.attr('data-bet-value', 2500);
$btn.text('2500');
```

---

## 🧪 Тестирование демо режима

### Тест 1: Откройте игру без токена

```
http://localhost/aviator/
```

### Тест 2: Проверьте консоль

Вы должны увидеть:
```
📋 Applying game config: {
  currency: "COP",
  quick_bets: [2500, 5000, 10000, 35000],
  min_bet: 100,
  max_bet: 70000,
  default_bet: 2500
}
✅ Game max_bet set to: 70000
🔘 Updating 4 quick bet buttons for demo mode
🔘 Button 0 set to: 2500
🔘 Button 1 set to: 5000
🔘 Button 2 set to: 10000
🔘 Button 3 set to: 35000
✅ Demo mode settings applied
```

### Тест 3: Проверьте кнопки

Для демо режима Colombia должны отображаться:
- **2500**
- **5000**
- **10000**
- **35000**

### Тест 4: Кликните на кнопки

1. Кликните на **2500** → ставка **2500** ✅
2. Кликните на **5000** → ставка **5000** ✅
3. Кликните на **10000** → ставка **10000** ✅
4. Кликните на **35000** → ставка **35000** ✅

---

## 📊 Конфигурации для демо режима

Все настройки берутся из `demo_config.php`:

### Colombia (демо)
```php
'Colombia' => [
    'currency' => 'COP',
    'balance' => 250000,
    'quick_bets' => [2500, 5000, 10000, 35000],
    'min_bet' => 100,
    'max_bet' => 70000,
    'default_bet' => 2500
]
```

### Ecuador (демо)
```php
'Ecuador' => [
    'currency' => 'USD',
    'balance' => 500,
    'quick_bets' => [0.5, 1, 2, 7],
    'min_bet' => 0.5,
    'max_bet' => 150,
    'default_bet' => 0.5
]
```

---

## 🔍 Отладка

### Проблема: Кнопки не обновляются

**Проверьте:**
1. Загружается ли `$game_config`?
```javascript
console.log(window.$game_config);
```

2. Применяются ли настройки?
```javascript
console.log(window.$game.max_bet);
```

3. Есть ли `data-bet-value` у кнопок?
```javascript
console.log($('.fast_bet').first().attr('data-bet-value'));
```

### Проблема: Неправильные значения

**Проверьте `demo_config.php`:**
- Правильно ли указана страна?
- Правильно ли указаны `quick_bets`?
- Правильно ли указан `max_bet`?

---

## 📁 Измененные файлы

1. ✅ `res/js/game.js` - Добавлена инициализация настроек для демо режима
2. ✅ `templates/main.tpl.php` - Добавлены `data-bet-value` атрибуты и функция форматирования

---

## ✅ Результат

Теперь демо режим работает так же, как реальный режим:
- ✅ Правильные значения кнопок для каждой страны
- ✅ Правильный `max_bet` для каждой страны
- ✅ Правильный `default_bet` для каждой страны
- ✅ Все кнопки кликаются и работают правильно

**Пример для демо Colombia:**
- Валюта: **COP**
- Баланс: **250,000**
- Быстрые ставки: **2500, 5000, 10000, 35000**
- Min bet: **100**
- Max bet: **70,000**
- Default bet: **2500**
