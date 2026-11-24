/* Chatbot: começa pequeno e cresce a cada alternativa escolhida */
(function () {
  const PERGUNTAS = [
    { chave: "evento", titulo: "1. Para que tipo de evento é o buquê?", linha: true, opcoes: [["jantar", "Jantar"], ["especial", "Especial"], ["presente", "Presente"]] },
    { chave: "tamanho", titulo: "2. Qual tamanho do buquê?", opcoes: [["pequeno", "Pequeno", "Delicado e intimista", "~20cm"], ["medio", "Médio (Clássico)", "Harmonia ideal para mesas", "~32cm"], ["grande", "Grande", "Imponente e marcante", "~45cm"]] },
    { chave: "sentimento", titulo: "3. Qual sentimento você quer passar?", opcoes: [["felicidade", "Felicidade (tons vibrantes)"], ["carinho", "Carinho (tons pastéis)"], ["acolhimento", "Acolhimento (tons terrosos)"]] },
  ];
  const resp = {};
  const raiz = document.getElementById("chatbot");
  const corpo = raiz.querySelector(".chat-corpo");

  function render() {
    const etapa = Object.keys(resp).length;
    let html = `<div class="d-flex align-items-center gap-2 mb-3"><div class="chat-progresso flex-grow-1"><div style="width:${(etapa / 3) * 100}%"></div></div>
      <span class="eyebrow">Etapa ${Math.min(etapa + 1, 3)} de 3${etapa === 3 ? " • concluída" : ""}</span></div>
      <div class="balao">Olá! Sou o curador botânico da <b>La Flora</b>. Responda 3 perguntas rápidas para encontrarmos o arranjo perfeito.</div>`;
    PERGUNTAS.slice(0, etapa + 1).forEach((q) => {
      html += `<div class="pergunta fade-in">${q.titulo}</div><div class="${q.linha ? "opcao-linha" : ""}">`;
      q.opcoes.forEach(([v, t, sub, dir]) => {
        const sel = resp[q.chave] === v;
        html += `<button class="opcao ${sel ? "selecionada" : ""}" data-q="${q.chave}" data-v="${v}">
          <span>${t}${sub ? `<br><small class="text-suave">${sub}</small>` : ""}</span>
          ${sel && !q.linha ? '<i class="bi bi-check-circle"></i>' : dir ? `<small class="text-suave">${dir}</small>` : ""}</button>`;
      });
      html += `</div>`;
    });
    if (etapa === 3) {
      const p = PRODUTOS.find((x) => x.evento === resp.evento && x.sentimento === resp.sentimento);
      html += `<div class="recomendacao mt-3 fade-in"><span class="badge rounded-pill" style="background:var(--verde)">Recomendação ideal para você</span>
        <div class="d-flex gap-2 bg-white rounded-3 p-2 my-2"><div class="item-carrinho p-0"><div class="mini"><img src="${caminhoImg(p)}" onerror="this.remove()"></div></div>
        <div><div class="serif fs-5">${p.nome}</div><small class="text-suave">${p.descricao}</small><div class="fw-bold text-verde">${brl(p.preco)}</div></div></div>
        <button class="btn btn-verde w-100" data-recomendado="${p.id}"><i class="bi bi-bag me-1"></i>Adicionar à Sacola</button></div>`;
    }
    corpo.innerHTML = html;
    corpo.scrollTop = corpo.scrollHeight;
  }
  corpo.addEventListener("click", (e) => {
    const o = e.target.closest(".opcao");
    if (o) {
      const idx = PERGUNTAS.findIndex((q) => q.chave === o.dataset.q);
      PERGUNTAS.slice(idx + 1).forEach((q) => delete resp[q.chave]);
      resp[o.dataset.q] = o.dataset.v; render();
    }
    const r = e.target.closest("[data-recomendado]");
    if (r) { const p = PRODUTOS.find((x) => x.id === r.dataset.recomendado); Carrinho.adicionar(p); mostrarAviso(`${p.nome} adicionado à sacola!`, "sucesso"); }
  });
  raiz.querySelector(".chat-topo").addEventListener("click", () => {
    raiz.classList.toggle("aberto");
    raiz.querySelector(".chat-seta").className = "bi chat-seta ms-auto " + (raiz.classList.contains("aberto") ? "bi-chevron-down" : "bi-chevron-up");
  });
  raiz.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault(); const t = e.target.msg.value.trim(); if (!t) return;
    window.open(`https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(t)}`, "_blank"); e.target.reset();
  });
  render();
})();
