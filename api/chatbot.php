<?php

require __DIR__ . '/conexao.php';

$dados = entrada();
exigirAutenticacao();

$opcoes = [
    'evento' => ['jantar', 'especial', 'presente'],
    'tamanho' => ['pequeno', 'medio', 'grande'],
    'sentimento' => ['felicidade', 'carinho', 'acolhimento'],
];
foreach ($opcoes as $campo => $valores) {
    if (!in_array($dados[$campo] ?? null, $valores, true)) {
        responder(false, 'Responda todas as perguntas do assistente com opções válidas.', [], 422);
    }
}

try {
    // O catálogo atual não distingue produtos por tamanho.
    $stmt = conectar()->prepare(
        "SELECT id, nome, descricao, preco, img
         FROM produtos
         WHERE ativo = 1 AND categoria IN ('mix', 'individuais')
           AND evento = :evento AND sentimento = :sentimento
         ORDER BY id
         LIMIT 1"
    );
    $stmt->execute(['evento' => $dados['evento'], 'sentimento' => $dados['sentimento']]);
    $produto = $stmt->fetch();
} catch (PDOException $erro) {
    erroBanco($erro);
}

if (!$produto) {
    responder(true, 'Nenhum buquê disponível para essa combinação.', ['produto' => null]);
}

$produto['preco'] = (float) $produto['preco'];
responder(true, '', ['produto' => $produto]);
