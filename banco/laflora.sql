CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    nascimento DATE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    papel ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(40) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    preco DECIMAL(10,2) UNSIGNED NOT NULL,
    categoria ENUM('mix', 'individuais', 'acessorio') NOT NULL,
    evento VARCHAR(30),
    sentimento VARCHAR(30),
    img VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    total DECIMAL(12,2) UNSIGNED NOT NULL,
    cartao_para VARCHAR(120),
    cartao_mensagem VARCHAR(240),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedido_itens (
    pedido_id INT UNSIGNED NOT NULL,
    produto_id VARCHAR(40) NOT NULL,
    quantidade INT UNSIGNED NOT NULL,
    preco_unitario DECIMAL(10,2) UNSIGNED NOT NULL,
    PRIMARY KEY (pedido_id, produto_id),
    CONSTRAINT fk_itens_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
    CONSTRAINT chk_itens_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo inicial da main. Uma nova importação preserva produtos já cadastrados.
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-1', 'Buquê de Gérberas Vibrantes', 'Gérberas amarelas e laranjas com astromélias', 89.00, 'mix', 'jantar', 'felicidade', 'Gérberas amarelas e laranjas com astromélias.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-2', 'Buquê de Rosas e Lisianthus', 'Rosas rosa-claro, lisianthus branco e eucalipto', 94.00, 'mix', 'jantar', 'carinho', 'Rosas rosa-claro, lisianthus branco e eucalipto.webp') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-3', 'Buquê de Rosas Cappuccino', 'Rosas cappuccino e eucalipto', 69.00, 'individuais', 'jantar', 'acolhimento', 'Rosas cappuccino e eucalipto.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-4', 'Buquê de Girassóis e Rosas', 'Girassóis, rosas laranjas e solidago', 115.00, 'mix', 'especial', 'felicidade', 'Girassóis, rosas laranjas e solidago.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-5', 'Buquê de Peônias e Rosas Brancas', 'Peônias rosa-claro, rosas brancas e mosquitinho', 78.00, 'mix', 'especial', 'carinho', 'Peônias rosa-claro, rosas brancas e mosquitinho.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-6', 'Buquê de Dálias Terracota', 'Dálias terracota, rosas creme e eucalipto', 139.00, 'mix', 'especial', 'acolhimento', 'Dálias terracota, rosas creme e eucalipto.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-7', 'Buquê de Tulipas Coloridas', 'Tulipas amarelas, laranjas e pink', 82.00, 'mix', 'presente', 'felicidade', 'Tulipas amarelas, laranjas e pink.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-8', 'Buquê de Hortênsias Rosadas', 'Hortênsias rosadas, lisianthus branco e mini-rosas', 99.00, 'mix', 'presente', 'carinho', 'Hortênsias rosadas, lisianthus branco e mini-rosas.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('buque-9', 'Buquê de Rosas Terracota', 'Rosas terracota, leucadendros e eucalipto', 105.00, 'mix', 'presente', 'acolhimento', 'Rosas terracota, leucadendros e eucalipto.png') ON DUPLICATE KEY UPDATE id = produtos.id;
INSERT INTO produtos (id, nome, descricao, preco, categoria, evento, sentimento, img)
VALUES ('cartao', 'Cartão Caligráfico Artesanal', 'Papel de algodão prensado 300g', 15.00, 'acessorio', NULL, NULL, NULL) ON DUPLICATE KEY UPDATE id = produtos.id;
