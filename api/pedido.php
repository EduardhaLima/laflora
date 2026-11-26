<?php

require __DIR__ . '/conexao.php';

$usuario = exigirAutenticacao();
$dados = entrada();

if (empty($dados['itens']) || !is_array($dados['itens'])) {
    responder(false, 'Informe ao menos um item para o pedido.', [], 422);
}

$quantidadesPorId = [];
foreach ($dados['itens'] as $item) {
    if (!is_array($item)) {
        responder(false, 'Formato de item inválido.', [], 422);
    }

    $id = trim((string) ($item['id'] ?? ''));
    $qtdRaw = $item['quantidade'] ?? $item['qtd'] ?? null;
    $quantidade = filter_var($qtdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if ($id === '' || strlen($id) > 40 || $quantidade === false) {
        responder(false, 'Cada item deve possuir ID válido e quantidade inteira positiva.', [], 422);
    }

    $quantidadesPorId[$id] = ($quantidadesPorId[$id] ?? 0) + $quantidade;
}

$cartao = is_array($dados['cartao'] ?? null) ? $dados['cartao'] : [];
$cartaoPara = trim((string) ($cartao['para'] ?? ''));
$cartaoMensagem = trim((string) ($cartao['mensagem'] ?? ''));

if (mb_strlen($cartaoPara) > 120) {
    responder(false, 'O nome do(a) homenageado(a) deve ter no máximo 120 caracteres.', [], 422);
}
if (mb_strlen($cartaoMensagem) > 240) {
    responder(false, 'A mensagem do cartão deve ter no máximo 240 caracteres.', [], 422);
}

$pdo = conectar();

try {
    $ids = array_keys($quantidadesPorId);
    $placeholders = implode(', ', array_fill(0, count($ids), '?'));

    $stmtProdutos = $pdo->prepare(
        "SELECT id, nome, preco, categoria
         FROM produtos
         WHERE ativo = 1 AND id IN ($placeholders)"
    );
    $stmtProdutos->execute($ids);
    $produtosBanco = [];
    foreach ($stmtProdutos->fetchAll() as $prod) {
        $produtosBanco[$prod['id']] = $prod;
    }

    if (count($produtosBanco) !== count($ids)) {
        responder(false, 'Um ou mais produtos selecionados estão indisponíveis ou não existem.', [], 422);
    }

    $possuiBuque = false;
    $totalCentavos = 0;
    $itensCalculados = [];

    foreach ($quantidadesPorId as $id => $quantidade) {
        $prod = $produtosBanco[$id];
        if ($prod['categoria'] !== 'acessorio') {
            $possuiBuque = true;
        } elseif ($quantidade !== 1) {
            responder(false, 'Acessórios permitem apenas 1 unidade por pedido.', [], 422);
        }

        $precoCentavos = (int) round(((float) $prod['preco']) * 100);
        $subtotalCentavos = $precoCentavos * $quantidade;
        $totalCentavos += $subtotalCentavos;

        $itensCalculados[] = [
            'id' => $prod['id'],
            'nome' => $prod['nome'],
            'quantidade' => $quantidade,
            'preco_unitario' => $precoCentavos / 100,
            'subtotal' => $subtotalCentavos / 100,
        ];
    }

    if (!$possuiBuque) {
        responder(false, 'Adicione pelo menos um buquê antes de finalizar.', [], 422);
    }

    $totalDecimal = number_format($totalCentavos / 100, 2, '.', '');

    $pdo->beginTransaction();

    $stmtPedido = $pdo->prepare(
        'INSERT INTO pedidos (usuario_id, total, cartao_para, cartao_mensagem)
         VALUES (:usuario_id, :total, :cartao_para, :cartao_mensagem)'
    );
    $stmtPedido->execute([
        'usuario_id' => $usuario['id'],
        'total' => $totalDecimal,
        'cartao_para' => $cartaoPara !== '' ? $cartaoPara : null,
        'cartao_mensagem' => $cartaoMensagem !== '' ? $cartaoMensagem : null,
    ]);

    $pedidoId = (int) $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES (:pedido_id, :produto_id, :quantidade, :preco_unitario)'
    );

    foreach ($itensCalculados as $item) {
        $stmtItem->execute([
            'pedido_id' => $pedidoId,
            'produto_id' => $item['id'],
            'quantidade' => $item['quantidade'],
            'preco_unitario' => number_format($item['preco_unitario'], 2, '.', ''),
        ]);
    }

    $pdo->commit();

    responder(true, 'Pedido registrado!', [
        'pedido_id' => $pedidoId,
        'total' => (float) $totalDecimal,
        'itens' => $itensCalculados,
    ], 201);
} catch (PDOException $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    erroBanco($erro);
}