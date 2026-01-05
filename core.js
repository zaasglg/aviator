// Database connection removed
console.log('🔥 THIS core.js FILE IS RUNNING 🔥');

const axios = require('axios').default;

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');

var $trace = true;

app.use(cors({
	methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
	optionsSuccessStatus: 200,
	origin: '*', //process.env.ORIGIN, 
	credentials: true,
	headers: 'Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken'
}));
app.options('*', cors());

const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		credentials: true,
		allowEIO3: false,
		rejectUnauthorized: false,
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
	}
});

app.get('/', (req, res) => { res.send('WebSocket Server Running on port 2345'); });


io.sockets.on('connection', (socket) => {
	console.log('✓ New client connected! Socket ID:', socket.id);
	console.log('  Total clients:', io.engine.clientsCount);

	socket.emit('message', JSON.stringify({ uid: "all", msg: 'connection complete' }));

	socket.on('message', ($input) => {
		console.log("Received message from", socket.id, ":", $input);
	});

	socket.on('disconnect', () => {
		console.log('✗ Client disconnected:', socket.id);
		console.log('  Total clients:', io.engine.clientsCount);
	});
});

server.listen(2345, '0.0.0.0', () => { console.log('listening on *:2345'); });


var TIMERS = [
	{ 'id': 'loading', 'time': 7000 },
	{ 'id': 'flying', 'time': 30000 },
	{ 'id': 'finish', 'time': 5000 }
];
var CUR_STATE = 2;
var START = new Date().getTime();
var CURRENT_GAME = 0;
var CURRENT_CF = 1;

async function current_game() {
	// Database removed - return mock data
	return null;
}

async function last_game() {
	// Database removed - return mock data
	return { cf: 1 };
}

async function next_cf() {
	// Database removed - generate random coefficient
	var amount = +(Math.random() * 8 + 1.2).toFixed(2); // от 1.2 до 9.2
	console.log("Next cf (random):", amount);
	return { id: Date.now(), amount: amount };
}

async function create_game() {
	var $next_cf = await next_cf();
	if ($next_cf && $next_cf.amount && $next_cf.amount > 1) {
		CURRENT_CF = $next_cf.amount;
		console.log("[create_game] NEXT_CF:", CURRENT_CF);
	} else {
		CURRENT_CF = +(Math.random() * 1 + 1.5).toFixed(2);
		console.log("[create_game] NEXT_CF fallback:", CURRENT_CF);
	}
	CURRENT_GAME = Date.now();
	console.log("New game created:", CURRENT_GAME);

	// Отправляем новый коэффициент СРАЗУ после генерации (ДО flying!)
	var nextCfMsg = {
		uid: "all",
		msg: "next_coefficient",
		cf: CURRENT_CF,
		game_id: CURRENT_GAME
	};
	console.log("📢 Sending next_coefficient:", nextCfMsg);
	io.emit('next_coefficient', JSON.stringify(nextCfMsg));
}

async function start_game() {
	console.log("Game started:", CURRENT_GAME);
}

async function close_bets($game_id) {
	console.log("Bets closed for game:", $game_id);
}

async function finish_game() {
	console.log("Game finished:", CURRENT_GAME);
	close_bets(CURRENT_GAME);
}

async function update_server() {
	var $cur_time = new Date().getTime();
	var $delta = $cur_time - START;

	// Отправляем текущий коэффициент во время полета
	if (CUR_STATE === 1) { // flying state
		var current_cf = 1 + ($delta / 1000) * 0.05;
		if (current_cf >= CURRENT_CF) {
			current_cf = CURRENT_CF;
			// Завершаем игру когда достигнут целевой коэффициент
			START = $cur_time;
			CUR_STATE = 2; // переходим к finish
		}
		io.emit('coefficient', JSON.stringify({
			uid: "all",
			msg: "coefficient_update",
			cf: current_cf.toFixed(2)
		}));
	}

	if ($delta >= TIMERS[CUR_STATE].time) {
		START = $cur_time;
		CUR_STATE += 1;
		CUR_STATE = CUR_STATE >= TIMERS.length ? 0 : CUR_STATE;
		var $res = {
			uid: "all",
			msg: "Change game state",
			game: {
				id: CURRENT_GAME,
				state: TIMERS[CUR_STATE].id,
				cf: CURRENT_CF,
				delta: TIMERS[CUR_STATE].time
			}
		}
		switch (CUR_STATE) {
			case 0: 		// loading
				create_game();
				break;
			case 1: 		// flying 
				start_game();
				TIMERS[CUR_STATE].time = $res.game.delta = parseInt(5000 * Math.log(2 * CURRENT_CF - 1));
				console.log("Set fly timer to: " + TIMERS[CUR_STATE].time);
				break;
			case 2: 		// finish 
				finish_game();
				break;
		}
		console.log("System message: ", $res);
		io.emit('message', JSON.stringify($res));
	}
}

var process_game = setInterval(update_server, 1000);

//process.exit(); 

