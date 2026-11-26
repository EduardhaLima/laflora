/* Carrinho salvo no navegador */
const Carrinho = {
  ler() {
    const itens = JSON.parse(localStorage.getItem("laflora_carrinho") || "null");
    if (itens === null) {
      return [{ id: "cartao", nome: "Cartão Caligráfico Artesanal", descricao: "Papel de algodão prensado 300g", preco: 15, qtd: 1, cartao: true }];
    }

    const atualizados = itens.flatMap((item) => {
      if (!/^p[1-9]$/.test(item.id)) return [item];
      const produto = PRODUTOS.find((p) => p.img === item.img);
      return produto ? [{ ...item, id: produto.id }] : [];
    });

    if (atualizados.some((item, indice) => item !== itens[indice]) || atualizados.length !== itens.length) {
      localStorage.setItem("laflora_carrinho", JSON.stringify(atualizados));
    }
    return atualizados;
  },
  salvar(itens) { localStorage.setItem("laflora_carrinho", JSON.stringify(itens)); Carrinho.atualizarBadge(); },
  limpar() {
    localStorage.removeItem("laflora_carrinho");
    Carrinho.atualizarBadge();
  },
  adicionar(p) {
    const itens = Carrinho.ler();
    const ex = itens.find((i) => i.id === p.id);
    ex ? ex.qtd++ : itens.unshift({ id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco, img: p.img, qtd: 1 });
    Carrinho.salvar(itens);
  },
  total() { return Carrinho.ler().reduce((s, i) => s + i.preco * i.qtd, 0); },
  atualizarBadge() {
    const b = document.getElementById("badge-carrinho");
    if (b) b.textContent = Carrinho.ler().filter((i) => !i.cartao).reduce((s, i) => s + i.qtd, 0);
  },
};
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function exigirLogin() { if (!sessionStorage.getItem("laflora_usuario")) location.href = "../login/login.html"; }
function exigirAdmin() {
  if (!sessionStorage.getItem("laflora_usuario")) return exigirLogin();
  const usuario = JSON.parse(sessionStorage.getItem("laflora_usuario") || "{}");
  if (usuario.papel !== "admin") location.href = "../catalogo/catalogo.html";
}
function renderizarMenuAdmin() {
  const usuario = JSON.parse(sessionStorage.getItem("laflora_usuario") || "{}");
  const nav = document.querySelector(".nav-topo");
  if (!nav || usuario.papel !== "admin" || nav.querySelector("[data-admin-link]")) return;
  nav.insertAdjacentHTML("beforeend",
    '<a href="../produtos/produtos.html" data-admin-link>Produtos</a>' +
    '<a href="../usuarios/usuarios.html" data-admin-link>Usuários</a>'
  );
}
async function sair() { await chamarApi("logout"); sessionStorage.removeItem("laflora_usuario"); location.href = "../login/login.html"; }
