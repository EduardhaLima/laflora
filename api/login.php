<?php

require __DIR__ . '/conexao.php';

$dados = entrada();
if (!is_string($dados['email'] ?? null) || !is_string($dados['senha'] ?? null)
    || trim($dados['email']) === '' || $dados['senha'] === '') {
    responder(false, 'Preencha e-mail e senha.', [], 422);
}

try {
    $comando = conectar()->prepare(
        'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = :email AND ativo = 1'
    );
    $comando->execute(['email' => strtolower(trim($dados['email']))]);
    $usuario = $comando->fetch();
} catch (PDOException $erro) {
    erroBanco($erro);
}

if (!$usuario || strlen($dados['senha']) > 72 || !password_verify($dados['senha'], $usuario['senha_hash'])) {
    responder(false, 'E-mail ou senha incorretos.', [], 401);
}

session_regenerate_id(true);
unset($usuario['senha_hash']);
$_SESSION['usuario'] = $usuario;
responder(true, 'Bem-vindo(a) à La Flora!', ['usuario' => $usuario]);
