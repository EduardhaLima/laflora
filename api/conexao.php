<?php

session_start();
header('Content-Type: application/json; charset=utf-8');

function conectar(): PDO
{
    // Os valores padrão são do MAMP local. Use variáveis de ambiente em outras instalações.
    $host = getenv('LAFLORA_DB_HOST') ?: '127.0.0.1';
    $porta = getenv('LAFLORA_DB_PORT') ?: '8889';
    $banco = getenv('LAFLORA_DB_NAME') ?: 'laflora';
    $usuario = getenv('LAFLORA_DB_USER') ?: 'root';
    $senha = getenv('LAFLORA_DB_PASSWORD');

    return new PDO("mysql:host=$host;port=$porta;dbname=$banco;charset=utf8mb4", $usuario,
        $senha === false ? 'root' : $senha, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
}

function responder(bool $sucesso, string $mensagem, array $dados = [], int $status = 200): never
{
    http_response_code($status);
    echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem] + $dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function entrada(): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        responder(false, 'Método não permitido.', [], 405);
    }

    $dados = json_decode(file_get_contents('php://input'), true);
    if (!is_array($dados)) {
        responder(false, 'Envie os dados em JSON.', [], 400);
    }

    return $dados;
}

function erroBanco(PDOException $erro): never
{
    error_log('LaFlora: falha no banco (SQLSTATE ' . $erro->getCode() . ').');
    responder(false, 'Não foi possível acessar o banco de dados.', [], 500);
}
