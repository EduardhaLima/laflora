/* Configuração geral — ajuste quando o backend PHP estiver pronto */
const CONFIG = {
  // Pasta onde ficarão os arquivos PHP
  API_BASE: "/api",
  // Ative para simular contas e catálogo sem PHP.
  MODO_DEMO: false,
  // Número do WhatsApp do ateliê (DDI + DDD + número, só dígitos)
  WHATSAPP: "5581999999999",
  ENDPOINTS: {
    login: "/login.php",       // POST {email, senha}        -> {sucesso, mensagem, usuario}
    cadastro: "/cadastro.php", // POST {nome,email,telefone,senha,nascimento} -> {sucesso, mensagem}
    produtos: "/produtos.php", // GET -> {sucesso, produtos:[]}
    pedido: "/pedido.php",     // POST {itens, cartao, total} -> {sucesso, mensagem, pedido_id}
    logout: "/logout.php"      // POST -> {sucesso}
  }
};
