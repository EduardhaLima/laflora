/* Carrinho salvo no navegador */
const Carrinho = {
  ler() { return JSON.parse(localStorage.getItem("laflora_carrinho") || "null") ?? [{ id: "cartao", nome: "Cartão Caligráfico Artesanal", descricao: "Papel de algodão prensado 300g", preco: 15, qtd: 1, cartao: true }]; },
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
function exigirLogin() { if (!sessionStorage.getItem("laflora_usuario")) location.href = "login.html"; }
async function sair() { await chamarApi("logout"); sessionStorage.removeItem("laflora_usuario"); location.href = "login.html"; }
