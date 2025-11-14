<?php
header('Content-Type: application/json');

$historyFile = __DIR__ . '/data/history.json';

// Создаем файл если его нет
if (!file_exists($historyFile)) {
    $initialData = ['history' => []];
    
    // Генерируем начальную историю (100 коэффициентов)
    for ($i = 0; $i < 100; $i++) {
        $cf = round(mt_rand(100, 1000) / 100, 2); // От 1.00 до 10.00
        $initialData['history'][] = $cf;
    }
    
    file_put_contents($historyFile, json_encode($initialData, JSON_PRETTY_PRINT));
}

$action = isset($_GET['action']) ? $_GET['action'] : 'get';

switch ($action) {
    case 'get':
        // Получить историю
        $data = json_decode(file_get_contents($historyFile), true);
        echo json_encode([
            'success' => true,
            'history' => $data['history']
        ]);
        break;
        
    case 'add':
        // Добавить новый коэффициент
        $input = json_decode(file_get_contents('php://input'), true);
        $cf = isset($input['cf']) ? floatval($input['cf']) : 0;
        
        if ($cf > 0) {
            $data = json_decode(file_get_contents($historyFile), true);
            $data['history'][] = $cf;
            
            // Оставляем только последние 200 коэффициентов
            if (count($data['history']) > 200) {
                $data['history'] = array_slice($data['history'], -200);
            }
            
            file_put_contents($historyFile, json_encode($data, JSON_PRETTY_PRINT));
            
            echo json_encode([
                'success' => true,
                'message' => 'Coefficient added'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid coefficient'
            ]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Unknown action'
        ]);
}
