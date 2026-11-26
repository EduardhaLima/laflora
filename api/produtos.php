<?php

require __DIR__ . '/conexao.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo = conectar();

function validarProduto(array $dados, bool $criacao): array
{
    $id = is_string($dados['id'] ?? null) ? trim($dados['id']) : '';
    $nome = trim((string) ($dados['nome'] ?? ''));
    $descricao = trim((string) ($dados['descricao'] ?? ''));
    $categoria = trim((string) ($dados['categoria'] ?? ''));
    $evento = trim((string) ($dados['evento'] ?? ''));
    $sentimento = trim((string) ($dados['sentimento'] ?? ''));
    $img = trim((string) ($dados['img'] ?? ''));
    $ativo = isset($dados['ativo']) ? (bool) $dados['ativo'] : true;

    if (!$criacao && ($id === '' || strlen($id) > 40)) {
        responder(false, 'ID do produto inválido.', [], 422);
    }
    if ($nome === '' || mb_strlen($nome) > 120) {
        responder(false, 'Informe o nome do produto (até 120 caracteres).', [], 422);
    }
    if ($descricao === '' || mb_strlen($descricao) > 255) {
        responder(false, 'Informe a descrição do produto (até 255 caracteres).', [], 422);
    }
    if (!is_numeric($dados['preco'] ?? null) || (float) $dados['preco'] < 0) {
        responder(false, 'Informe um preço válido.', [], 422);
    }
    if (!in_array($categoria, ['mix', 'individuais', 'acessorio'], true)) {
        responder(false, 'Categoria inválida.', [], 422);
    }
    if (mb_strlen($evento) > 30 || mb_strlen($sentimento) > 30 || mb_strlen($img) > 255) {
        responder(false, 'Evento, sentimento ou nome da imagem excedem o tamanho permitido.', [], 422);
    }

    return [
        'id' => $criacao ? 'prod-' . bin2hex(random_bytes(16)) : $id,
        'nome' => $nome,
        'descricao' => $descricao,
        'preco' => number_format((float) $dados['preco'], 2, '.', ''),
        'categoria' => $categoria,
        'evento' => $evento !== '' ? $evento : null,
        'sentimento' => $sentimento !== '' ? $sentimento : null,
        'img' => $img !== '' ? $img : null,
        'ativo' => $ativo ? 1 : 0,
    ];
}

if ($metodo === 'GET') {
    $modoAdmin = ($_GET['modo'] ?? '') === 'admin';
    if ($modoAdmin) {
        exigirAdmin();
        $sql = "SELECT id, nome, descricao, preco, categoria, evento, sentimento, img, ativo
                FROM produtos
                WHERE :busca_vazia = '' OR id LIKE :id OR nome LIKE :nome
                ORDER BY id";
    } else {
        exigirAutenticacao();
        $sql = "SELECT id, nome, descricao, preco, categoria, evento, sentimento, img
                FROM produtos
                WHERE ativo = 1 AND categoria IN ('mix', 'individuais')
                ORDER BY id";
    }

    try {
        $stmt = $pdo->prepare($sql);
        $busca = $_GET['busca'] ?? '';
        if ($modoAdmin && !is_string($busca)) {
            responder(false, 'Informe um termo de busca válido.', [], 422);
        }
        if ($modoAdmin) {
            $busca = trim($busca);
            $termo = '%' . $busca . '%';
            $stmt->execute(['busca_vazia' => $busca, 'id' => $termo, 'nome' => $termo]);
        } else {
            $stmt->execute();
        }
        $produtos = $stmt->fetchAll();
    } catch (PDOException $erro) {
        erroBanco($erro);
    }

    foreach ($produtos as &$produto) {
        $produto['preco'] = (float) $produto['preco'];
        if (array_key_exists('ativo', $produto)) {
            $produto['ativo'] = (bool) $produto['ativo'];
        }
    }
    unset($produto);

    responder(true, '', ['produtos' => $produtos]);
}

if ($metodo === 'POST') {
    exigirAdmin();
    $produto = validarProduto(entrada(), true);

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img, ativo)
             VALUES (:id, :nome, :descricao, :preco, :categoria, :evento, :sentimento, :img, :ativo)'
        );
        $stmt->execute($produto);
        responder(true, 'Produto cadastrado com sucesso.', ['id' => $produto['id']], 201);
    } catch (PDOException $erro) {
        if (($erro->errorInfo[1] ?? null) === 1062) {
            responder(false, 'Não foi possível gerar um ID único. Tente cadastrar novamente.', [], 409);
        }
        erroBanco($erro);
    }
}

if ($metodo === 'PUT') {
    exigirAdmin();
    $produto = validarProduto(entrada(['PUT']), false);

    try {
        $stmt = $pdo->prepare(
            'UPDATE produtos
             SET nome = :nome, descricao = :descricao, preco = :preco, categoria = :categoria,
                 evento = :evento, sentimento = :sentimento, img = :img, ativo = :ativo
             WHERE id = :id'
        );
        $stmt->execute($produto);

        if ($stmt->rowCount() === 0) {
            $existe = $pdo->prepare('SELECT 1 FROM produtos WHERE id = :id');
            $existe->execute(['id' => $produto['id']]);
            if (!$existe->fetchColumn()) {
                responder(false, 'Produto não encontrado.', [], 404);
            }
        }
        responder(true, 'Produto atualizado com sucesso.');
    } catch (PDOException $erro) {
        erroBanco($erro);
    }
}

if ($metodo === 'DELETE') {
    exigirAdmin();
    $dados = entrada(['DELETE']);
    $id = is_string($dados['id'] ?? null) ? trim($dados['id']) : '';
    $definitivo = ($dados['definitivo'] ?? false) === true;
    if ($id === '' || strlen($id) > 40) {
        responder(false, 'ID do produto inválido.', [], 422);
    }

    try {
        if ($definitivo) {
            $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
            $stmt->execute(['id' => $id]);
            if ($stmt->rowCount() === 0) {
                responder(false, 'Produto não encontrado.', [], 404);
            }
            responder(true, 'Produto excluído definitivamente.');
        }

        $stmt = $pdo->prepare('UPDATE produtos SET ativo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            $existe = $pdo->prepare('SELECT 1 FROM produtos WHERE id = :id');
            $existe->execute(['id' => $id]);
            if (!$existe->fetchColumn()) {
                responder(false, 'Produto não encontrado.', [], 404);
            }
        }
        responder(true, 'Produto desativado com sucesso.');
    } catch (PDOException $erro) {
        if (($erro->errorInfo[1] ?? null) === 1451) {
            responder(false, 'Este produto tem pedidos vinculados e só pode ser desativado.', [], 409);
        }
        erroBanco($erro);
    }
}

header('Allow: GET, POST, PUT, DELETE');
responder(false, 'Método não permitido.', [], 405);