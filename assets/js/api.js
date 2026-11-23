/* Comunicação com o backend PHP. Todas as respostas esperam JSON {sucesso, mensagem, ...} */
async function chamarApi(nome, dados = null, metodo = "POST") {
  if (CONFIG.MODO_DEMO) return simular(nome, dados);
  let url = CONFIG.API_BASE + CONFIG.ENDPOINTS[nome];
  const opcoes = { method: metodo, headers: { "Content-Type": "application/json" }, credentials: "include" };
  if (metodo === "GET" && dados) url += "?" + new URLSearchParams(dados);
  else if (dados) opcoes.body = JSON.stringify(dados);
  try {
    const r = await fetch(url, opcoes);
    const json = await r.json();
    if (!r.ok) json.sucesso = false;
    return json;
  } catch (e) {
    return { sucesso: false, mensagem: "Não foi possível conectar ao servidor." };
  }
}

/* Respostas simuladas enquanto o PHP não existe */
function simular(nome, d) {
  return new Promise((ok) => setTimeout(() => {
    if (nome === "login") {
      const contas = JSON.parse(localStorage.getItem("laflora_contas") || "[]");
      const conta = contas.find((c) => c.email === d.email && c.senha === d.senha);
      if (conta || (d.email === "demo@laflora.com" && d.senha === "12345678"))
        return ok({ sucesso: true, mensagem: "Bem-vindo(a) à La Flora!", usuario: { nome: conta?.nome || "Cliente" } });
      return ok({ sucesso: false, mensagem: "E-mail ou senha incorretos." });
    }
    if (nome === "cadastro") {
      const contas = JSON.parse(localStorage.getItem("laflora_contas") || "[]");
      if (contas.some((c) => c.email === d.email)) return ok({ sucesso: false, mensagem: "Este e-mail já está cadastrado." });
      contas.push(d); localStorage.setItem("laflora_contas", JSON.stringify(contas));
      return ok({ sucesso: true, mensagem: "Conta criada com sucesso! Faça login." });
    }
    if (nome === "pedido") return ok({ sucesso: true, mensagem: "Pedido registrado!", pedido_id: Date.now() });
    ok({ sucesso: true });
  }, 400));
}
