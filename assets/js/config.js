/* Configuração geral — ajuste quando o backend PHP estiver pronto */
const CONFIG = {
  // Pasta onde ficarão os arquivos PHP
  API_BASE: "/api",
  // true = simula respostas (sem PHP). Mude para false quando o backend existir.
  MODO_DEMO: true,
  // Número do WhatsApp do ateliê (DDI + DDD + número, só dígitos)
  WHATSAPP: "5581999999999",
  ENDPOINTS: {
    login: "/login.php",       // POST {email, senha}        -> {sucesso, mensagem, usuario}
    cadastro: "/cadastro.php", // POST {nome,email,telefone,senha,nascimento} -> {sucesso, mensagem}
    produtos: "/produtos.php", // GET  ?categoria=todos|mix|individuais -> {sucesso, produtos:[]}
    pedido: "/pedido.php",     // POST {itens, cartao, total} -> {sucesso, mensagem, pedido_id}
    logout: "/logout.php"      // POST -> {sucesso}
  }
};
