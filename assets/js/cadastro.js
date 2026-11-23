document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const dados = { nome: f.nome.value.trim(), email: f.email.value.trim(), telefone: f.telefone.value.trim(), senha: f.senha.value, nascimento: f.nascimento.value };
  if (!dados.nome || !dados.email || !dados.telefone || !dados.senha || !dados.nascimento) return mostrarAviso("Preencha todos os campos.", "erro");
  if (!/^\S+@\S+\.\S+$/.test(dados.email)) return mostrarAviso("E-mail inválido.", "erro");
  if (dados.senha.length < 8) return mostrarAviso("A senha precisa ter no mínimo 8 caracteres.", "erro");
  const r = await chamarApi("cadastro", dados);
  if (r.sucesso) { mostrarAviso(r.mensagem || "Cadastro realizado!", "sucesso"); setTimeout(() => (location.href = "login.html"), 1200); }
  else mostrarAviso(r.mensagem || "Erro ao cadastrar.", "erro");
});
document.querySelectorAll("[data-ver-senha]").forEach((b) => b.addEventListener("click", () => {
  const i = document.getElementById(b.dataset.verSenha); i.type = i.type === "password" ? "text" : "password";
}));
