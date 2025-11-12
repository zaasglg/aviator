<?php
/**
 * Simple WebSocket Server for Windows
 * Использует Ratchet вместо Workerman для совместимости с Windows
 */

require_once __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class AviatorGameServer implements MessageComponentInterface {
    protected $clients;
    protected $gameState;
    protected $timers = [
        ['id' => 'loading', 'time' => 10],
        ['id' => 'flight', 'time' => 30],
        ['id' => 'finish', 'time' => 5]
    ];
    protected $currentState = 0;
    protected $startTime = 0;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->gameState = 'loading';
        $this->startTime = time();
        echo "WebSocket Server initialized\n";
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        
        $response = [
            'type' => 'connected',
            'message' => 'Connected to Aviator Game Server',
            'clientId' => $conn->resourceId
        ];
        $conn->send(json_encode($response));
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        echo "Message from {$from->resourceId}: {$msg}\n";
        
        $data = json_decode($msg, true);
        
        $response = [
            'type' => 'message',
            'from' => $from->resourceId,
            'content' => $data
        ];
        
        // Отправляем всем подключенным клиентам
        foreach ($this->clients as $client) {
            $client->send(json_encode($response));
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Error: {$e->getMessage()}\n";
        $conn->close();
    }

    public function updateGameState() {
        $currentTime = time();
        $delta = $currentTime - $this->startTime;
        
        $currentTimer = $this->timers[$this->currentState];
        
        if ($delta >= $currentTimer['time']) {
            $this->currentState = ($this->currentState + 1) % count($this->timers);
            $this->startTime = $currentTime;
            $this->gameState = $this->timers[$this->currentState]['id'];
            
            $response = [
                'type' => 'gameState',
                'state' => $this->gameState,
                'timestamp' => $currentTime
            ];
            
            foreach ($this->clients as $client) {
                $client->send(json_encode($response));
            }
            
            echo "Game state changed to: {$this->gameState}\n";
        }
    }
}

echo "Starting Aviator WebSocket Server on port 2345...\n";
echo "Press Ctrl+C to stop\n\n";

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new AviatorGameServer()
        )
    ),
    2345
);

// Периодическое обновление состояния игры
$loop = $server->loop;
$gameServer = new AviatorGameServer();

$loop->addPeriodicTimer(1, function() use ($gameServer) {
    $gameServer->updateGameState();
});

$server->run();
