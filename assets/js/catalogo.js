exigirLogin();
const grade = document.getElementById("grade-produtos");
const titulos = { todos: "Todos os buquês", mix: "Mix de cores", individuais: "Cores individuais" };

function cardProduto(p) {
  return `<div class="col-6 col-lg-4 col-xl-3 produto fade-in">
    <div class="foto mb-2">
      <img src="${caminhoImg(p)}" alt="${p.nome}" onerror="this.remove()">
      <i class="bi bi-image fs-3"></i><span>Espaço p/ ${p.img}</span>
      <button class="add" data-add="${p.id}" aria-label="Adicionar ${p.nome}"><i class="bi bi-plus-lg"></i></button>
    </div>
    <div class="d-flex justify-content-between gap-2"><h3>${p.nome}</h3><span class="preco">${brl(p.preco)}</span></div>
    <small>${p.descricao}</small></div>`;
}
function renderizar(cat, busca = "") {
  const lista = PRODUTOS.filter((p) => (cat === "todos" || p.categoria === cat) && p.nome.toLowerCase().includes(busca.toLowerCase()));
  grade.innerHTML = lista.length ? lista.map(cardProduto).join("") : `<p class="text-suave">Nenhum buquê encontrado.</p>`;
  document.getElementById("qtd-designs").textContent = `(${lista.length} designs)`;
  document.getElementById("titulo-modelos").textContent = titulos[cat];
  atualizarLinkAtivo();
}
let catAtual = "todos";
document.querySelectorAll(".filtro-item").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".filtro-item").forEach((x) => x.classList.remove("ativo"));
  b.classList.add("ativo"); catAtual = b.dataset.cat; renderizar(catAtual, document.getElementById("busca").value);
}));
document.getElementById("busca").addEventListener("input", (e) => renderizar(catAtual, e.target.value));
grade.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]"); if (!b) return;
  const p = PRODUTOS.find((x) => x.id === b.dataset.add);
  Carrinho.adicionar(p); mostrarAviso(`${p.nome} adicionado à sacola!`, "sucesso");
});
document.getElementById("btn-sair").addEventListener("click", sair);

const linkCatalogo = document.querySelector('.nav-topo a[href="catalogo.html"]');
const linkContato = document.querySelector('.nav-topo a[href="#contato"]');
function atualizarLinkAtivo() {
  const inicioContato = document.getElementById("contato").getBoundingClientRect().top;
  const alturaCabecalho = document.querySelector(".topo").offsetHeight;
  const contatoAtivo = inicioContato <= window.innerHeight + alturaCabecalho;
  linkCatalogo.classList.toggle("ativo", !contatoAtivo);
  linkContato.classList.toggle("ativo", contatoAtivo);
}
window.addEventListener("scroll", atualizarLinkAtivo, { passive: true });
window.addEventListener("resize", atualizarLinkAtivo);

renderizar("todos"); Carrinho.atualizarBadge();
