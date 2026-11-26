exigirLogin();
renderizarMenuAdmin();
const lista = document.getElementById("lista-itens");
function render() {
  const itens = Carrinho.ler();
  lista.innerHTML = itens.length ? itens.map((i, idx) => `<div class="item-carrinho fade-in">
    <div class="mini">${i.img ? `<img src="../../assets/img/${encodeURIComponent(i.img)}" onerror="this.remove()">` : ""}</div>
    <div class="flex-grow-1"><div class="serif fs-5">${escaparHtml(i.nome)}</div><small class="text-suave">${escaparHtml(i.descricao)}</small></div>
    ${i.cartao ? '<span class="badge rounded-pill bg-areia text-dark">Item de Ateliê</span>' :
      `<div class="qtd"><button data-menos="${idx}">−</button><span class="px-2">${i.qtd}</span><button data-mais="${idx}">+</button></div>`}
    <div class="text-end"><div class="fw-bold">${brl(i.preco * i.qtd)}</div><button class="btn btn-link btn-sm text-suave p-0" data-remover="${idx}"><i class="bi bi-trash"></i> Remover</button></div>
  </div>`).join("") : `<p class="text-suave text-center py-4">Sua sacola está vazia.</p>`;
  document.getElementById("qtd-itens").textContent = `${itens.length} produtos selecionados`;
  document.getElementById("subtotal").textContent = brl(Carrinho.total());
  document.getElementById("total").textContent = brl(Carrinho.total());
  Carrinho.atualizarBadge();
}
lista.addEventListener("click", (e) => {
  const itens = Carrinho.ler(); const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.mais) itens[b.dataset.mais].qtd++;
  if (b.dataset.menos) itens[b.dataset.menos].qtd = Math.max(1, itens[b.dataset.menos].qtd - 1);
  if (b.dataset.remover) { itens.splice(b.dataset.remover, 1); mostrarAviso("Item removido.", "sucesso"); }
  Carrinho.salvar(itens); render();
});
const msg = document.getElementById("mensagem");
msg.addEventListener("input", () => {
  document.getElementById("contador").textContent = `${msg.value.length} / 240`;
  document.getElementById("previa").textContent = msg.value ? `"${msg.value}"` : '"Para iluminar seus dias com a mesma graça que você ilumina a minha vida."';
});
document.getElementById("inspiracao").addEventListener("click", () => {
  msg.value = "Para iluminar seus dias com a mesma graça que você ilumina a minha vida."; msg.dispatchEvent(new Event("input"));
});
const btnFinalizar = document.getElementById("finalizar");
const pedidoRegistrado = document.getElementById("pedido-registrado");
btnFinalizar.addEventListener("click", async () => {
  const itens = Carrinho.ler();
  if (!itens.some((i) => !i.cartao)) {
    return mostrarAviso("Adicione pelo menos um buquê antes de finalizar.", "erro");
  }

  btnFinalizar.disabled = true;

  const cartao = {
    para: document.getElementById("homenageado").value.trim(),
    mensagem: msg.value.trim(),
  };

  const payload = {
    itens: itens.map((i) => ({ id: i.id, quantidade: i.qtd })),
    cartao,
  };

  const r = await chamarApi("pedido", payload);
  btnFinalizar.disabled = false;

  if (!r.sucesso) {
    return mostrarAviso(r.mensagem || "Erro ao registrar o pedido.", "erro");
  }

  const totalOficial = typeof r.total === "number" ? r.total : Carrinho.total();
  const itensResumo = Array.isArray(r.itens) ? r.itens : itens;

  // Reseta o carrinho para o estado inicial e atualiza a tela
  Carrinho.limpar();
  document.getElementById("homenageado").value = "";
  msg.value = "";
  msg.dispatchEvent(new Event("input"));
  render();

  let texto = `Olá! Gostaria de finalizar meu pedido #${r.pedido_id} na La Flora:\n\n`;
  itensResumo.forEach((i) => {
    const qtd = i.quantidade ?? i.qtd;
    const subtotal = i.subtotal ?? (i.preco * qtd);
    texto += `• ${qtd}x ${i.nome} — ${brl(subtotal)}\n`;
  });
  texto += `\nTotal: ${brl(totalOficial)}`;
  if (cartao.mensagem) {
    texto += `\n\nCartão para ${cartao.para || "-"}: "${cartao.mensagem}"`;
  }

  const linkWhatsApp = document.getElementById("pedido-whatsapp");
  linkWhatsApp.href = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(texto)}`;
  pedidoRegistrado.hidden = false;
  document.getElementById("pedido-confirmacao").textContent =
    `Pedido #${r.pedido_id} registrado. Continue no WhatsApp para falar com o ateliê.`;
  linkWhatsApp.focus();
});
document.getElementById("btn-sair").addEventListener("click", sair);
render();
