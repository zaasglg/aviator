window.addEventListener("DOMContentLoaded", function () {
  const coeffDisplay = document.querySelector(".rand_number");

  let gameState = {
    status: 'loading', // loading, flying, finish
    currentCoefficient: 1.00,
    gameId: null,
    nextCoefficient: null // Коэффициент следующей игры
  };

  // Подключение к WebSocket серверу (локальный с поддержкой next_coefficient)
  const socket = io.connect('http://localhost:2345', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  // Успешное подключение
  socket.on('connect', function () {
    console.log('✓ Connected to WebSocket server!');
    console.log('Socket ID:', socket.id);

    // Обновляем статус
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#00E676';
    if (statusText) statusText.textContent = 'Conectado';

    // Запрашиваем текущее состояние игры
    socket.emit('get_current_state');
  });

  // Ошибка подключения
  socket.on('connect_error', function (error) {
    console.error('✗ WebSocket connection error:', error);

    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#FF1744';
    if (statusText) statusText.textContent = 'Error';
  });

  // Отключение
  socket.on('disconnect', function () {
    console.log('✗ Disconnected from WebSocket server');

    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#FFD900';
    if (statusText) statusText.textContent = 'Reconectando...';
  });

  // Обновление коэффициента (НЕ используем - показываем только финальный)
  socket.on('coefficient', function (data) {
    // Игнорируем обновления во время полета
    // Показываем только финальный результат в состоянии FINISH
  });

  // Получение текущего состояния игры (при подключении)
  socket.on('current_state', function (msg) {
    console.log('Current game state received:', msg);

    const obj = typeof msg === "string" ? JSON.parse(msg) : msg;

    if (obj && obj.game) {
      const data = {
        state: obj.game.state,
        cf: parseFloat(obj.game.cf).toFixed(2),
        delta: parseInt(obj.game.delta),
        id: obj.game.id
      };

      console.log('Initial game state:', data);

      // Обрабатываем текущее состояние
      switch (data.state) {
        case "loading":
          handleLoadingState(data);
          break;
        case "flying":
          // При подключении во время полета - показываем текущий коэффициент
          coeffDisplay.textContent = data.cf;
          gameState.currentCoefficient = parseFloat(data.cf);
          handleFlyingState(data);
          break;
        case "finish":
          handleFinishState(data);
          break;
      }
    }
  });

  // Изменение состояния игры
  socket.on('message', function (msg) {
    console.log('New message:', msg);

    const obj = typeof msg === "string" ? JSON.parse(msg) : msg;

    if (obj && obj.msg === "Change game state" && obj.game) {
      const data = {
        state: obj.game.state,
        cf: parseFloat(obj.game.cf).toFixed(2),
        delta: parseInt(obj.game.delta),
        id: obj.game.id
      };

      console.log('Game state change:', data);

      switch (data.state) {
        case "loading":
          handleLoadingState(data);
          break;
        case "flying":
          handleFlyingState(data);
          break;
        case "finish":
          handleFinishState(data);
          break;
      }
    }
  });

  // Обработка состояния LOADING - здесь приходят СТАРЫЕ данные предыдущего раунда
  function handleLoadingState(data) {
    console.log('→ LOADING state (ожидание нового раунда)');
    gameState.status = 'loading';
    gameState.gameId = data.id;

    // НЕ обновляем коэффициент - в LOADING приходят данные ПРЕДЫДУЩЕГО раунда
    // Новый коэффициент придёт ТОЛЬКО при переходе в FLYING

    document.querySelector('.first_step')?.classList.remove('flying', 'finished');
    document.querySelector('.first_step')?.classList.add('loading');
  }

  // Обработка состояния FLYING - ЗДЕСЬ приходит НОВЫЙ коэффициент (финальный результат раунда!)
  function handleFlyingState(data) {
    console.log('→ FLYING state - НОВЫЙ КОЭФФИЦИЕНТ:', data.cf, '(это финальный результат!)');
    gameState.status = 'flying';

    // Обновляем коэффициент на новый от текущей игры
    coeffDisplay.textContent = data.cf;
    gameState.currentCoefficient = parseFloat(data.cf);
    // Сохраняем как следующий коэффициент для показа в LOADING
    gameState.nextCoefficient = data.cf;

    document.querySelector('.first_step')?.classList.remove('loading', 'finished');
    document.querySelector('.first_step')?.classList.add('flying');
  }

  // Обработка состояния FINISH - НЕ меняем коэффициент, ждём следующий раунд
  function handleFinishState(data) {
    console.log('→ FINISH state - Раунд завершён, ждём новый коэффициент');
    gameState.status = 'finish';

    // НЕ обновляем коэффициент при FINISH
    // Коэффициент обновится когда начнётся новый раунд (FLYING)

    document.querySelector('.first_step')?.classList.remove('loading', 'flying');
    document.querySelector('.first_step')?.classList.add('finished');
  }

  // Обработчик для получения следующего коэффициента (приходит ДО flying!)
  socket.on('next_coefficient', function (data) {
    console.log('📢 NEXT COEFFICIENT received:', data);

    // Парсим JSON если это строка
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    const nextCf = obj.cf;

    if (nextCf) {
      gameState.nextCoefficient = parseFloat(nextCf).toFixed(2);
      // Сразу показываем новый коэффициент (пришёл ДО начала игры!)
      coeffDisplay.textContent = gameState.nextCoefficient;
      gameState.currentCoefficient = parseFloat(gameState.nextCoefficient);
      console.log('✅ Коэффициент обновлён ЗАРАНЕЕ:', gameState.nextCoefficient);
    }
  });

  // Логирование всех событий (для отладки)
  socket.onAny((eventName, ...args) => {
    console.log('Socket event:', eventName, args);
  });

  // Проверка состояния в консоли
  window.getGameState = function () {
    return {
      socketConnected: socket.connected,
      socketId: socket.id,
      gameState: gameState
    };
  };

  console.log('Aviator WebSocket initialized. Use getGameState() to check status.');
});