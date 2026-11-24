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

/* Descarta cadastros de versões da demo que guardavam senhas em texto puro. */
localStorage.removeItem("laflora_contas");

async function verificarSenhaDemo(senha, sal) {
  const encoder = new TextEncoder();
  const chave = await crypto.subtle.importKey("raw", encoder.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2", salt: Uint8Array.from(sal), iterations: 600000, hash: "SHA-256"
  }, chave, 256);
  return Array.from(new Uint8Array(bits)).join(",");
}

/* Respostas simuladas enquanto o PHP não existe */
async function simular(nome, d) {
  await new Promise((resolver) => setTimeout(resolver, 400));
  if (nome === "login" || nome === "cadastro") {
    const contas = JSON.parse(sessionStorage.getItem("laflora_contas_demo") || "[]");
    const conta = contas.find((c) => c.email === d.email);
    const emailDemo = "demo@laflora.com";

    if (nome === "login" && d.email === emailDemo && d.senha === "12345678") {
      return { sucesso: true, mensagem: "Bem-vindo(a) à La Flora!", usuario: { nome: "Cliente" } };
    }
    if (nome === "login" && !conta) return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
    if (nome === "cadastro" && (conta || d.email === emailDemo)) {
      return { sucesso: false, mensagem: "Este e-mail já está cadastrado." };
    }
    if (!globalThis.crypto?.subtle) {
      return { sucesso: false, mensagem: "Abra a demonstração por HTTPS ou localhost para usar o cadastro." };
    }

    if (nome === "login") {
      const verificador = await verificarSenhaDemo(d.senha, conta.sal);
      if (verificador !== conta.verificador) return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
      return { sucesso: true, mensagem: "Bem-vindo(a) à La Flora!", usuario: { nome: conta.nome } };
    }

    const sal = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const verificador = await verificarSenhaDemo(d.senha, sal);
    const contasAtuais = JSON.parse(sessionStorage.getItem("laflora_contas_demo") || "[]");
    if (contasAtuais.some((c) => c.email === d.email)) {
      return { sucesso: false, mensagem: "Este e-mail já está cadastrado." };
    }
    contasAtuais.push({ nome: d.nome, email: d.email, sal, verificador });
    sessionStorage.setItem("laflora_contas_demo", JSON.stringify(contasAtuais));
    return { sucesso: true, mensagem: "Conta de teste criada. Faça login nesta mesma aba." };
  }
  if (nome === "pedido") return { sucesso: true, mensagem: "Pedido registrado!", pedido_id: Date.now() };
  return { sucesso: true };
}
