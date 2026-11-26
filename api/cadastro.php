<?php

require __DIR__ . '/conexao.php';

$dados = entrada();
foreach (['nome', 'email', 'telefone', 'nascimento', 'senha'] as $campo) {
    if (!isset($dados[$campo]) || !is_string($dados[$campo])) {
        responder(false, 'Preencha todos os campos.', [], 422);
    }
}

$nome = trim($dados['nome']);
$email = strtolower(trim($dados['email']));
$telefone = trim($dados['telefone']);
$nascimento = $dados['nascimento'];
$senha = $dados['senha'];

if ($nome === '' || mb_strlen($nome) > 120 || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'Informe um nome e um e-mail válidos.', [], 422);
}
if (!preg_match('/^\d{2}9\d{8}$/D', $telefone)) {
    responder(false, 'Informe DDD e celular completos, com 11 dígitos.', [], 422);
}
$data = DateTimeImmutable::createFromFormat('!Y-m-d', $nascimento);
$limite = new DateTimeImmutable('today -18 years');
if (!$data || $data->format('Y-m-d') !== $nascimento || $data > $limite) {
    responder(false, 'Informe uma data válida. Você precisa ter pelo menos 18 anos.', [], 422);
}
if (mb_strlen($senha) < 8 || strlen($senha) > 72 || str_contains($senha, "\0")) {
    responder(false, 'Informe uma senha com pelo menos 8 caracteres e até 72 bytes.', [], 422);
}

try {
    $comando = conectar()->prepare(
        'INSERT INTO usuarios (nome, email, telefone, nascimento, senha_hash)
         VALUES (:nome, :email, :telefone, :nascimento, :senha_hash)'
    );
    $comando->execute([
        'nome' => $nome, 'email' => $email, 'telefone' => $telefone,
        'nascimento' => $nascimento, 'senha_hash' => password_hash($senha, PASSWORD_DEFAULT),
    ]);
} catch (PDOException $erro) {
    // O índice UNIQUE também impede duplicidade em cadastros simultâneos.
    if (($erro->errorInfo[1] ?? null) === 1062) {
        responder(false, 'Este e-mail já está cadastrado.', [], 409);
    }
    erroBanco($erro);
}

responder(true, 'Conta criada com sucesso! Faça login.', [], 201);
