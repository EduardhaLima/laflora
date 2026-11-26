<?php

require __DIR__ . '/conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responder(false, 'Método não permitido.', [], 405);
}
$_SESSION = [];
session_destroy();
responder(true, 'Você saiu da sua conta.');
