<?php

require __DIR__ . '/conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responder(false, 'Método não permitido.', [], 405);
}
if (empty($_SESSION['usuario']['id'])) {
    responder(false, 'Faça login para continuar.', [], 401);
}

// O catálogo e o chatbot usam os buquês ativos. O cartão é um acessório do carrinho.
try {
    $produtos = conectar()->query(
        "SELECT id, nome, descricao, preco, categoria, evento, sentimento, img
         FROM produtos
         WHERE ativo = 1 AND categoria IN ('mix', 'individuais')
         ORDER BY id"
    )->fetchAll();
} catch (PDOException $erro) {
    erroBanco($erro);
}

foreach ($produtos as &$produto) {
    $produto['preco'] = (float) $produto['preco'];
}
unset($produto);

responder(true, '', ['produtos' => $produtos]);
