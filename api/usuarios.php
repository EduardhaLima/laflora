<?php

require __DIR__ . '/conexao.php';

$admin = exigirAdmin();
$metodo = $_SERVER['REQUEST_METHOD'];
$pdo = conectar();

if ($metodo === 'GET') {
    try {
        $busca = trim((string) ($_GET['busca'] ?? ''));
        if ($busca !== '') {
            $termo = '%' . $busca . '%';
            $stmt = $pdo->prepare(
                'SELECT id, nome, email, telefone, nascimento, papel, ativo, criado_em
                 FROM usuarios
                 WHERE nome LIKE :nome OR email LIKE :email
                 ORDER BY id DESC'
            );
            $stmt->execute(['nome' => $termo, 'email' => $termo]);
            $usuarios = $stmt->fetchAll();
        } else {
            $usuarios = $pdo->query(
                'SELECT id, nome, email, telefone, nascimento, papel, ativo, criado_em
                 FROM usuarios
                 ORDER BY id DESC'
            )->fetchAll();
        }

        foreach ($usuarios as &$u) {
            $u['id'] = (int) $u['id'];
            $u['ativo'] = (bool) $u['ativo'];
        }
        unset($u);

        responder(true, '', ['usuarios' => $usuarios]);
    } catch (PDOException $erro) {
        erroBanco($erro);
    }
}

if ($metodo === 'PUT') {
    $dados = entrada(['PUT']);

    $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        responder(false, 'ID de usuário inválido.', [], 422);
    }

    foreach (['nome', 'email', 'telefone', 'nascimento', 'papel'] as $campo) {
        if (!isset($dados[$campo]) || !is_string($dados[$campo])) {
            responder(false, 'Preencha todos os campos obrigatórios.', [], 422);
        }
    }

    $nome = trim($dados['nome']);
    $email = strtolower(trim($dados['email']));
    $telefone = preg_replace('/\D+/', '', $dados['telefone']);
    $nascimento = trim($dados['nascimento']);
    $papel = trim($dados['papel']);
    $ativo = isset($dados['ativo']) ? (bool) $dados['ativo'] : true;
    $novaSenha = isset($dados['senha']) && is_string($dados['senha']) ? $dados['senha'] : '';

    if ($nome === '' || mb_strlen($nome) > 120 || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder(false, 'Informe um nome e um e-mail válidos.', [], 422);
    }
    if (!preg_match('/^\d{2}9\d{8}$/D', $telefone)) {
        responder(false, 'Informe DDD e celular completos, com 11 dígitos.', [], 422);
    }
    $data = DateTimeImmutable::createFromFormat('!Y-m-d', $nascimento);
    $limite = new DateTimeImmutable('today -18 years');
    if (!$data || $data->format('Y-m-d') !== $nascimento || $data > $limite) {
        responder(false, 'Informe uma data válida. O usuário deve ter pelo menos 18 anos.', [], 422);
    }
    if (!in_array($papel, ['cliente', 'admin'], true)) {
        responder(false, 'Papel inválido.', [], 422);
    }
    if ($id === (int) $admin['id'] && (!$ativo || $papel !== 'admin')) {
        responder(false, 'Você não pode desativar ou remover seu próprio acesso de administrador.', [], 422);
    }
    if ($novaSenha !== '' && (mb_strlen($novaSenha) < 8 || strlen($novaSenha) > 72 || str_contains($novaSenha, "\0"))) {
        responder(false, 'A nova senha deve ter entre 8 caracteres e 72 bytes.', [], 422);
    }

    try {
        $campos = [
            'nome = :nome',
            'email = :email',
            'telefone = :telefone',
            'nascimento = :nascimento',
            'papel = :papel',
            'ativo = :ativo',
        ];
        $params = [
            'id' => $id,
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone,
            'nascimento' => $nascimento,
            'papel' => $papel,
            'ativo' => $ativo ? 1 : 0,
        ];

        if ($novaSenha !== '') {
            $campos[] = 'senha_hash = :senha_hash';
            $params['senha_hash'] = password_hash($novaSenha, PASSWORD_DEFAULT);
        }

        $sql = 'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $existe = $pdo->prepare('SELECT 1 FROM usuarios WHERE id = :id');
            $existe->execute(['id' => $id]);
            if (!$existe->fetchColumn()) {
                responder(false, 'Usuário não encontrado.', [], 404);
            }
        }

        responder(true, 'Usuário atualizado com sucesso.');
    } catch (PDOException $erro) {
        if (($erro->errorInfo[1] ?? null) === 1062) {
            responder(false, 'Este e-mail já está em uso por outro usuário.', [], 409);
        }
        erroBanco($erro);
    }
}

if ($metodo === 'DELETE') {
    $dados = entrada(['DELETE']);
    $id = filter_var($dados['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        responder(false, 'ID de usuário inválido.', [], 422);
    }
    if ($id === (int) $admin['id']) {
        responder(false, 'Você não pode desativar a própria conta.', [], 422);
    }

    try {
        $stmt = $pdo->prepare('UPDATE usuarios SET ativo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            $existe = $pdo->prepare('SELECT 1 FROM usuarios WHERE id = :id');
            $existe->execute(['id' => $id]);
            if (!$existe->fetchColumn()) {
                responder(false, 'Usuário não encontrado.', [], 404);
            }
        }
        responder(true, 'Usuário desativado com sucesso.');
    } catch (PDOException $erro) {
        erroBanco($erro);
    }
}

header('Allow: GET, PUT, DELETE');
responder(false, 'Método não permitido.', [], 405);