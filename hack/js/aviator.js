window.addEventListener("DOMContentLoaded", function () {
  const coeffDisplay = document.querySelector(".rand_number");
  const collectingInfo = document.querySelector(".collecting_info");
  
  let gameState = {
    status: 'loading', // loading, flying, finish
    currentCoefficient: 1.00,
    gameId: null,
    nextCoefficient: null // Коэффициент следующей игры
  };

  // Подключение к WebSocket серверу
  const socket = io.connect('wss://aviator.valor-games.co/', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  // Успешное подключение
  socket.on('connect', function() {
    console.log('✓ Connected to WebSocket server!');
    console.log('Socket ID:', socket.id);
    
    // Обновляем статус
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#00E676';
    if (statusText) statusText.textContent = 'Conectado';
    
    if (collectingInfo) {
      collectingInfo.textContent = 'Conexión establecida';
    }
    
    // Запрашиваем текущее состояние игры
    socket.emit('get_current_state');
  });

  // Ошибка подключения
  socket.on('connect_error', function(error) {
    console.error('✗ WebSocket connection error:', error);
    
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#FF1744';
    if (statusText) statusText.textContent = 'Error';
    
    if (collectingInfo) {
      collectingInfo.textContent = 'Error de conexión';
    }
  });

  // Отключение
  socket.on('disconnect', function() {
    console.log('✗ Disconnected from WebSocket server');
    
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (statusDot) statusDot.style.background = '#FFD900';
    if (statusText) statusText.textContent = 'Reconectando...';
    
    if (collectingInfo) {
      collectingInfo.textContent = 'Reconectando...';
    }
  });

  // Обновление коэффициента (НЕ используем - показываем только финальный)
  socket.on('coefficient', function(data) {
    // Игнорируем обновления во время полета
    // Показываем только финальный результат в состоянии FINISH
  });

  // Получение текущего состояния игры (при подключении)
  socket.on('current_state', function(msg) {
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
      switch(data.state) {
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
  socket.on('message', function(msg) {
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
      
      switch(data.state) {
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

  // Обработка состояния LOADING
  function handleLoadingState(data) {
    console.log('→ LOADING state', data);
    gameState.status = 'loading';
    gameState.gameId = data.id;
    
    // НЕ меняем коэффициент в LOADING
    // Новый коэффициент придет в FLYING и обновится автоматически
    
    if (collectingInfo) {
      collectingInfo.textContent = 'Recopilando información...';
    }
    
    document.querySelector('.first_step')?.classList.remove('flying', 'finished');
    document.querySelector('.first_step')?.classList.add('loading');
  }

  // Обработка состояния FLYING
  function handleFlyingState(data) {
    console.log('→ FLYING state - НОВЫЙ КОЭФФИЦИЕНТ:', data.cf);
    gameState.status = 'flying';
    
    // Обновляем коэффициент на новый от текущей игры
    coeffDisplay.textContent = data.cf;
    gameState.currentCoefficient = parseFloat(data.cf);
    // Сохраняем как следующий коэффициент для показа в LOADING
    gameState.nextCoefficient = data.cf;
    
    if (collectingInfo) {
      collectingInfo.textContent = 'Volando...';
    }
    
    document.querySelector('.first_step')?.classList.remove('loading', 'finished');
    document.querySelector('.first_step')?.classList.add('flying');
  }

  // Обработка состояния FINISH - ТОЛЬКО ЗДЕСЬ ОБНОВЛЯЕМ КОЭФФИЦИЕНТ
  function handleFinishState(data) {
    console.log('→ FINISH state - NEW COEFFICIENT:', data.cf);
    gameState.status = 'finish';
    gameState.currentCoefficient = parseFloat(data.cf);
    
    // ОБНОВЛЯЕМ КОЭФФИЦИЕНТ ТОЛЬКО КОГДА ИГРА ЗАКОНЧИЛАСЬ
    coeffDisplay.textContent = data.cf;
    if (collectingInfo) {
      collectingInfo.textContent = `Resultado: ${data.cf}x`;
    }
    
    document.querySelector('.first_step')?.classList.remove('loading', 'flying');
    document.querySelector('.first_step')?.classList.add('finished');
  }

  // Обработчик для получения следующего коэффициента
  socket.on('next_coefficient', function(data) {
    console.log('→ NEXT COEFFICIENT received:', data);
    const nextCf = typeof data === 'object' ? data.cf : data;
    if (nextCf) {
      gameState.nextCoefficient = parseFloat(nextCf).toFixed(2);
      // Если мы в состоянии LOADING - сразу показываем новый коэффициент
      if (gameState.status === 'loading') {
        coeffDisplay.textContent = gameState.nextCoefficient;
        gameState.currentCoefficient = parseFloat(gameState.nextCoefficient);
        console.log('→ Обновлен коэффициент в LOADING:', gameState.nextCoefficient);
      }
    }
  });

  // Логирование всех событий (для отладки)
  socket.onAny((eventName, ...args) => {
    console.log('Socket event:', eventName, args);
  });

  // Проверка состояния в консоли
  window.getGameState = function() {
    return {
      socketConnected: socket.connected,
      socketId: socket.id,
      gameState: gameState
    };
  };
  
  console.log('Aviator WebSocket initialized. Use getGameState() to check status.');
});