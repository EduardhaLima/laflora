if (sessionStorage.getItem("laflora_conta_excluida")) {
  sessionStorage.removeItem("laflora_conta_excluida");
  mostrarAviso("Conta excluída definitivamente.", "exclusao");
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim(), senha = e.target.senha.value;
  if (!email || !senha) return mostrarAviso("Preencha e-mail e senha.", "erro");
  const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
  const r = await chamarApi("login", { email, senha });
  btn.disabled = false;
  if (r.sucesso) {
    sessionStorage.setItem("laflora_usuario", JSON.stringify(r.usuario || { email }));
    mostrarAviso(r.mensagem || "Login realizado!", "sucesso");
    setTimeout(() => (location.href = "../catalogo/catalogo.html"), 900);
  } else mostrarAviso(r.mensagem || "Erro ao entrar.", "erro");
});
document.querySelectorAll("[data-ver-senha]").forEach((b) => b.addEventListener("click", () => {
  const i = document.getElementById(b.dataset.verSenha); i.type = i.type === "password" ? "text" : "password";
}));
