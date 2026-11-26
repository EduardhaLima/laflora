# LaFlora

Projeto acadêmico de floricultura. O cliente cria uma conta, entra no catálogo, recebe sugestões do assistente floral, calculadas pelo PHP a partir dos produtos do banco e registra pedidos no carrinho. Pelo ícone **Minha conta**, o cliente pode editar o perfil, trocar a senha e excluir a conta após confirmar a senha. Contas com pedidos vinculados são preservadas. Administradores gerenciam usuários e produtos pelas telas do site. O PHP usa PDO para gravar dados no MySQL ou MariaDB. A interface usa HTML, CSS, JavaScript e Bootstrap.

## Rodar localmente

1. Inicie Apache e MySQL no MAMP. Em **Preferences → Server**, aponte o **Document root** para a raiz do repositório.
2. No phpMyAdmin, crie um banco `laflora` com `utf8mb4_unicode_ci` e importe [banco/laflora.sql](banco/laflora.sql). O SQL carrega nove buquês e um cartão, além de criar as tabelas de contas e pedidos.
3. Com as portas padrão do MAMP, abra [a tela de cadastro](http://localhost:8888/paginas/cadastro/cadastro.html). O MySQL local usa a porta `8889`. Em outro ambiente, configure `LAFLORA_DB_HOST`, `LAFLORA_DB_PORT`, `LAFLORA_DB_NAME`, `LAFLORA_DB_USER` e `LAFLORA_DB_PASSWORD` no processo PHP. Use PHP 8.3 com `pdo_mysql` e `mbstring`.
4. Para criar o primeiro administrador em um banco de desenvolvimento, cadastre uma conta de teste, localize seu e-mail na tabela `usuarios` e altere o campo `papel` para `admin` pelo phpMyAdmin. Saia e entre novamente. O cabeçalho passa a mostrar **Produtos** e **Usuários**.

## Testar a entrega

A suíte Selenium usa Python 3 e Chrome (também aceita Safari com **Permitir automação remota** habilitado). Use um **banco de teste recém-importado**, pois a suíte cria contas, produtos e pedidos.

```sh
python3 -m venv /tmp/laflora-testes
source /tmp/laflora-testes/bin/activate
python -m pip install selenium
export LAFLORA_TEST_URL=http://localhost:8888
export LAFLORA_TEST_ADMIN_EMAIL=admin@example.test
read -rs 'LAFLORA_TEST_ADMIN_PASSWORD?Senha do administrador de teste: '
export LAFLORA_TEST_ADMIN_PASSWORD
python testes/selenium_fluxos.py
unset LAFLORA_TEST_ADMIN_PASSWORD
```

No Safari, defina também `LAFLORA_TEST_BROWSER=safari`. Os testes cobrem cadastro, login, recomendação, registro do pedido, edição de perfil, troca de senha, exclusão da própria conta, permissões e os dois CRUDs administrativos. O teste de checkout verifica o link sem abrir o WhatsApp nem enviar mensagem. Para uma conferência manual, encontre o número do pedido em `pedidos` e compare o total com as quantidades e preços em `pedido_itens`.

## Publicar a demonstração

- Use um servidor com PHP, MySQL ou MariaDB e HTTPS. Publique na raiz do domínio ou subdomínio para que o caminho `/api` funcione. Mantenha o SQL e os testes fora da pasta pública.
- Crie um banco e um usuário próprios na hospedagem, importe o SQL e configure as variáveis de ambiente com os valores fornecidos pelo servidor. Crie o primeiro administrador no banco hospedado.
- Configure o número do ateliê em `assets/js/config.js` antes de demonstrar o envio por WhatsApp. Execute os testes em um ambiente separado e confira cadastro, catálogo, administração e pedidos pela URL hospedada.
