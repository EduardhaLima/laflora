const campoNascimento = document.getElementById("nascimento");
const dataLimiteCadastro = new Date();
dataLimiteCadastro.setHours(0, 0, 0, 0);
dataLimiteCadastro.setFullYear(dataLimiteCadastro.getFullYear() - 18);

const formatarDataLocal = (data) => {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
};

campoNascimento.max = formatarDataLocal(dataLimiteCadastro);

const campoTelefone = document.getElementById("telefone");

function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  if (numero.length <= 5) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
}

function contarDigitosAte(valor, posicao) {
  return valor.slice(0, posicao).replace(/\D/g, "").length;
}

function posicaoAposDigitos(valor, quantidade) {
  if (quantidade === 0) return 0;
  let encontrados = 0;
  for (let i = 0; i < valor.length; i++) {
    if (/\d/.test(valor[i]) && ++encontrados === quantidade) return i + 1;
  }
  return valor.length;
}

campoTelefone.addEventListener("input", (e) => {
  const input = e.currentTarget;
  const valorAnterior = input.value;
  const cursor = input.selectionStart ?? valorAnterior.length;
  const digitos = valorAnterior.replace(/\D/g, "").slice(0, 11);
  const digitosAteCursor = contarDigitosAte(valorAnterior, cursor);
  const valorFormatado = formatarTelefone(valorAnterior);

  input.value = valorFormatado;
  const novaPosicao = digitosAteCursor >= digitos.length
    ? valorFormatado.length
    : posicaoAposDigitos(valorFormatado, digitosAteCursor);
  input.setSelectionRange(novaPosicao, novaPosicao);
});

campoTelefone.addEventListener("keydown", (e) => {
  if (e.key !== "Backspace" && e.key !== "Delete") return;
  const input = e.currentTarget;
  const cursor = input.selectionStart;
  if (cursor !== input.selectionEnd) return;

  const valor = input.value;
  const digitos = valor.replace(/\D/g, "");
  const caractereAdjacente = e.key === "Backspace" ? valor[cursor - 1] : valor[cursor];
  if (!caractereAdjacente || /\d/.test(caractereAdjacente)) return;

  const indiceDigito = contarDigitosAte(valor, cursor) - (e.key === "Backspace" ? 1 : 0);
  if (indiceDigito < 0 || indiceDigito >= digitos.length) return;

  e.preventDefault();
  const novosDigitos = digitos.slice(0, indiceDigito) + digitos.slice(indiceDigito + 1);
  const novoValor = formatarTelefone(novosDigitos);
  input.value = novoValor;
  const novaPosicao = posicaoAposDigitos(novoValor, indiceDigito);
  input.setSelectionRange(novaPosicao, novaPosicao);
});

document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const dados = {
    nome: f.nome.value.trim().replace(/\s+/g, " "),
    email: f.email.value.trim(),
    telefone: f.telefone.value.replace(/\D/g, ""),
    senha: f.senha.value,
    nascimento: f.nascimento.value,
  };

  if (!dados.nome || !dados.email || !dados.telefone || !dados.senha || !dados.nascimento)
    return mostrarAviso("Preencha todos os campos.", "erro");

  if (dados.nome.split(" ").length < 2)
    return mostrarAviso("Informe seu nome e sobrenome.", "erro");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email))
    return mostrarAviso("Informe um e-mail válido.", "erro");

  if (!/^\d{2}9\d{8}$/.test(dados.telefone))
    return mostrarAviso("Informe DDD e celular completos, com 11 dígitos.", "erro");

  if (dados.senha.length < 8)
    return mostrarAviso("A senha precisa ter no mínimo 8 caracteres.", "erro");

  const dataNascimento = new Date(`${dados.nascimento}T00:00:00`);
  if (Number.isNaN(dataNascimento.getTime()) || dataNascimento > dataLimiteCadastro)
    return mostrarAviso("Você precisa ter pelo menos 18 anos para se cadastrar.", "erro");

  const r = await chamarApi("cadastro", dados);
  if (r.sucesso) {
    mostrarAviso(r.mensagem || "Cadastro realizado!", "sucesso");
    setTimeout(() => (location.href = "../login/login.html"), 1200);
  } else mostrarAviso(r.mensagem || "Erro ao cadastrar.", "erro");
});

document.querySelectorAll("[data-ver-senha]").forEach((b) => b.addEventListener("click", () => {
  const i = document.getElementById(b.dataset.verSenha);
  i.type = i.type === "password" ? "text" : "password";
}));
