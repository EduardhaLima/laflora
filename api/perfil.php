<?php

require __DIR__ . '/conexao.php';

$metodo = $_SERVER['REQUEST_METHOD'];
if (!in_array($metodo, ['GET', 'PUT', 'DELETE'], true)) {
    header('Allow: GET, PUT, DELETE');
    responder(false, 'Método não permitido.', [], 405);
}

$usuario = exigirAutenticacao();
$id = $usuario['id'];

try {
    $pdo = conectar();
    if ($metodo === 'GET') {
        $stmt = $pdo->prepare('SELECT nome, email, telefone FROM usuarios WHERE id = :id AND ativo = 1');
        $stmt->execute(['id' => $id]);
        $perfil = $stmt->fetch();
        if (!$perfil) {
            responder(false, 'Conta indisponível.', [], 401);
        }
        responder(true, '', ['perfil' => $perfil]);
    }

    $dados = entrada(['PUT', 'DELETE']);
    if ($metodo === 'PUT' && ($dados['acao'] ?? null) === 'perfil') {
        foreach (['nome', 'email', 'telefone'] as $campo) {
            if (!is_string($dados[$campo] ?? null)) {
                responder(false, 'Preencha todos os campos.', [], 422);
            }
        }
        $nome = trim($dados['nome']);
        $email = strtolower(trim($dados['email']));
        $telefone = preg_replace('/\D+/', '', $dados['telefone']);
        if ($nome === '' || mb_strlen($nome) > 120 || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            responder(false, 'Informe um nome e um e-mail válidos.', [], 422);
        }
        if (!preg_match('/^\d{2}9\d{8}$/D', $telefone)) {
            responder(false, 'Informe DDD e celular completos, com 11 dígitos.', [], 422);
        }

        $stmt = $pdo->prepare(
            'UPDATE usuarios SET nome = :nome, email = :email, telefone = :telefone WHERE id = :id AND ativo = 1'
        );
        $perfil = ['nome' => $nome, 'email' => $email, 'telefone' => $telefone];
        $stmt->execute($perfil + ['id' => $id]);
        $_SESSION['usuario'] = ['nome' => $nome, 'email' => $email] + $usuario;
        responder(true, 'Perfil atualizado.', ['perfil' => $perfil]);
    }

    if ($metodo === 'PUT' && ($dados['acao'] ?? null) !== 'senha') {
        responder(false, 'Ação inválida.', [], 422);
    }
    if ($metodo === 'DELETE' && $usuario['papel'] === 'admin') {
        responder(false, 'Peça a outro administrador para desativar esta conta.', [], 403);
    }

    $senhaAtual = $dados['senha_atual'] ?? null;
    $stmt = $pdo->prepare('SELECT senha_hash FROM usuarios WHERE id = :id AND ativo = 1');
    $stmt->execute(['id' => $id]);
    $hash = $stmt->fetchColumn();
    if (!$hash || !is_string($senhaAtual) || strlen($senhaAtual) > 72 || !password_verify($senhaAtual, $hash)) {
        responder(false, 'Senha atual incorreta.', [], 422);
    }

    $params = ['id' => $id, 'hash_atual' => $hash];
    if ($metodo === 'DELETE') {
        $stmt = $pdo->prepare(
            "UPDATE usuarios SET ativo = 0 WHERE id = :id AND ativo = 1 AND papel = 'cliente' AND senha_hash = :hash_atual"
        );
    } else {
        $senhaNova = $dados['senha_nova'] ?? null;
        if (!is_string($senhaNova) || mb_strlen($senhaNova) < 8 || strlen($senhaNova) > 72 || str_contains($senhaNova, "\0")) {
            responder(false, 'Informe uma nova senha com pelo menos 8 caracteres e até 72 bytes.', [], 422);
        }
        $stmt = $pdo->prepare(
            'UPDATE usuarios SET senha_hash = :hash_novo WHERE id = :id AND ativo = 1 AND senha_hash = :hash_atual'
        );
        $params['hash_novo'] = password_hash($senhaNova, PASSWORD_DEFAULT);
    }
    $stmt->execute($params);
    if ($stmt->rowCount() !== 1) {
        responder(false, 'A conta foi alterada. Atualize a página e tente novamente.', [], 409);
    }

    if ($metodo === 'DELETE') {
        $_SESSION = [];
        session_destroy();
        responder(true, 'Conta desativada.');
    }
    session_regenerate_id(true);
    responder(true, 'Senha alterada.');
} catch (PDOException $erro) {
    if (($erro->errorInfo[1] ?? null) === 1062) {
        responder(false, 'Este e-mail já está em uso.', [], 409);
    }
    erroBanco($erro);
}
