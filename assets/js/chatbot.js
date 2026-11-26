/* Assistente floral com recomendação por evento e sentimento. */
(function () {
  const PERGUNTAS = [
    { chave: "evento", titulo: "1. Para que tipo de evento é o buquê?", linha: true, opcoes: [["jantar", "Jantar"], ["especial", "Especial"], ["presente", "Presente"]] },
    { chave: "tamanho", titulo: "2. Qual tamanho do buquê?", opcoes: [["pequeno", "Pequeno", "Delicado e intimista", "~20cm"], ["medio", "Médio (Clássico)", "Harmonia ideal para mesas", "~32cm"], ["grande", "Grande", "Imponente e marcante", "~45cm"]] },
    { chave: "sentimento", titulo: "3. Qual sentimento você quer passar?", opcoes: [["felicidade", "Felicidade (tons vibrantes)"], ["carinho", "Carinho (tons pastéis)"], ["acolhimento", "Acolhimento (tons terrosos)"]] },
  ];
  const TEMPO_INATIVIDADE = 2 * 60 * 1000;
  const resp = {};
  const raiz = document.getElementById("chatbot");
  const corpo = raiz.querySelector(".chat-corpo");
  let conversaAtiva = false;
  let aguardandoReinicio = false;
  let temporizadorInatividade;
  let numeroConsulta = 0;
  let recomendacao = null;
  let consultando = false;

  function limparRespostas() {
    numeroConsulta++;
    recomendacao = null;
    consultando = false;
    Object.keys(resp).forEach((chave) => delete resp[chave]);
  }

  function cancelarTemporizador() {
    clearTimeout(temporizadorInatividade);
    temporizadorInatividade = null;
  }

  function mostrarTelaInicial(
    mensagem = "Olá! Posso ajudar você a encontrar um buquê especial.",
    textoBotao = "Ajuda para escolher um buquê"
  ) {
    corpo.innerHTML = `<div class="balao">${mensagem}</div>
      <button type="button" class="btn btn-verde w-100 mt-3" data-iniciar>${textoBotao}</button>`;
  }

  function finalizarConversa(mensagem) {
    cancelarTemporizador();
    conversaAtiva = false;
    limparRespostas();
    mostrarTelaInicial(mensagem);
  }

  function expirarConversa() {
    cancelarTemporizador();
    conversaAtiva = false;
    aguardandoReinicio = true;
    limparRespostas();
    mostrarTelaInicial(
      "A conversa foi encerrada por falta de atividade. Clique abaixo para reiniciar o chat.",
      "Reiniciar chat"
    );
    raiz.classList.add("bloqueado", "aberto");
    raiz.querySelector(".chat-seta").className = "bi chat-seta ms-auto bi-chevron-down";
  }

  function renovarTemporizador() {
    if (!conversaAtiva) return;
    cancelarTemporizador();
    temporizadorInatividade = setTimeout(expirarConversa, TEMPO_INATIVIDADE);
  }

  function iniciarConversa() {
    cancelarTemporizador();
    limparRespostas();
    aguardandoReinicio = false;
    raiz.classList.remove("bloqueado");
    conversaAtiva = true;
    renovarTemporizador();
    render();
  }

  async function consultarRecomendacao() {
    const numero = ++numeroConsulta;
    consultando = true;
    render();
    const { evento, tamanho, sentimento } = resp;
    const resposta = await chamarApi("chatbot", { evento, tamanho, sentimento });
    if (numero !== numeroConsulta) return;
    recomendacao = resposta;
    consultando = false;
    render();
  }

  function render() {
    const etapa = PERGUNTAS.filter((q) => resp[q.chave]).length;
    let html = `<div class="d-flex align-items-center gap-2 mb-3"><div class="chat-progresso flex-grow-1"><div style="width:${(etapa / 3) * 100}%"></div></div>
      <span class="eyebrow">Etapa ${Math.min(etapa + 1, 3)} de 3${etapa === 3 ? " • concluída" : ""}</span></div>
      <div class="balao">Olá! Sou o curador botânico da <b>La Flora</b>. Responda 3 perguntas rápidas para encontrarmos o arranjo perfeito.</div>`;

    PERGUNTAS.slice(0, etapa + 1).forEach((q) => {
      html += `<div class="pergunta fade-in">${q.titulo}</div><div class="${q.linha ? "opcao-linha" : ""}">`;
      q.opcoes.forEach(([valor, titulo, descricao, dimensao]) => {
        const selecionada = resp[q.chave] === valor;
        html += `<button type="button" class="opcao ${selecionada ? "selecionada" : ""}" data-q="${q.chave}" data-v="${valor}">
          <span>${titulo}${descricao ? `<br><small class="text-suave">${descricao}</small>` : ""}</span>
          ${selecionada && !q.linha ? '<i class="bi bi-check-circle"></i>' : dimensao ? `<small class="text-suave">${dimensao}</small>` : ""}</button>`;
      });
      html += `</div>`;
    });

    const produto = recomendacao?.sucesso ? recomendacao.produto : null;
    if (etapa === 3 && consultando) {
      html += '<div class="balao mt-3" role="status">Buscando um buquê…</div>';
    }
    if (etapa === 3 && !consultando && !produto) {
      const mensagem = recomendacao?.mensagem || "Não foi possível consultar o assistente.";
      html += `<div class="balao mt-3">${escaparHtml(mensagem)}</div>
        <button type="button" class="opcao" data-nova-recomendacao>Iniciar uma nova recomendação</button>`;
    }
    if (etapa === 3 && produto) {
      html += `<div class="recomendacao mt-3 fade-in"><span class="badge rounded-pill" style="background:var(--verde)">Recomendação ideal para você</span>
        <div class="d-flex gap-2 bg-white rounded-3 p-2 my-2"><div class="item-carrinho p-0"><div class="mini"><img src="${caminhoImg(produto)}" alt="${escaparHtml(produto.nome)}" onerror="this.remove()"></div></div>
        <div><div class="serif fs-5">${escaparHtml(produto.nome)}</div><small class="text-suave">${escaparHtml(produto.descricao)}</small><div class="fw-bold text-verde">${brl(produto.preco)}</div></div></div>
        <div class="pergunta">Você ficou satisfeito com esta recomendação?</div>`;

      if (!resp.satisfacao) {
        html += `<div class="opcao-linha">
          <button type="button" class="opcao" data-satisfacao="sim">Sim</button>
          <button type="button" class="opcao" data-satisfacao="nao">Não</button>
        </div>`;
      } else if (resp.satisfacao === "sim") {
        html += `<div class="pergunta">Deseja adicionar este buquê ao carrinho?</div>
          <div class="opcao-linha">
            <button type="button" class="opcao" data-adicionar="sim">Sim</button>
            <button type="button" class="opcao" data-adicionar="nao">Não</button>
          </div>`;
      } else {
        html += `<div class="opcao-linha flex-column">
          <button type="button" class="opcao" data-nova-recomendacao>Iniciar uma nova recomendação</button>
          <button type="button" class="opcao" data-atendente>Falar com um atendente pelo WhatsApp</button>
        </div>`;
      }

      html += `</div>`;
    }

    corpo.innerHTML = html;
    corpo.scrollTop = corpo.scrollHeight;
  }

  corpo.addEventListener("click", (e) => {
    const botao = e.target.closest("button");
    if (!botao) return;

    if (botao.hasAttribute("data-iniciar")) {
      iniciarConversa();
      return;
    }

    if (!conversaAtiva) return;
    renovarTemporizador();

    if (botao.dataset.q) {
      const indice = PERGUNTAS.findIndex((q) => q.chave === botao.dataset.q);
      PERGUNTAS.slice(indice + 1).forEach((q) => delete resp[q.chave]);
      delete resp.satisfacao;
      resp[botao.dataset.q] = botao.dataset.v;
      numeroConsulta++;
      recomendacao = null;
      consultando = false;
      if (PERGUNTAS.every((pergunta) => resp[pergunta.chave])) consultarRecomendacao();
      else render();
      return;
    }

    if (botao.dataset.satisfacao === "sim") {
      resp.satisfacao = "sim";
      render();
      return;
    }

    if (botao.dataset.satisfacao === "nao") {
      resp.satisfacao = "nao";
      render();
      return;
    }

    if (botao.hasAttribute("data-nova-recomendacao")) {
      iniciarConversa();
      return;
    }

    if (botao.hasAttribute("data-atendente")) {
      window.open(
        `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent("Olá! Preciso de ajuda para escolher um buquê.")}`,
        "_blank",
        "noopener,noreferrer"
      );
      finalizarConversa("Você pode falar com nosso atendente pelo WhatsApp ou iniciar uma nova recomendação.");
      return;
    }

    if (botao.dataset.adicionar === "nao") {
      finalizarConversa("Tudo bem! Você pode iniciar novamente quando quiser.");
      return;
    }

    if (botao.dataset.adicionar === "sim") {
      const produto = recomendacao?.produto;
      if (!produto) return;
      Carrinho.adicionar(produto);
      cancelarTemporizador();
      conversaAtiva = false;
      corpo.innerHTML = `<div class="balao">Buquê adicionado à sacola. Abrindo seu carrinho...</div>`;
      setTimeout(() => (location.href = "../carrinho/carrinho.html"), 800);
    }
  });

  raiz.querySelector(".chat-topo").addEventListener("click", () => {
    if (aguardandoReinicio) return;
    renovarTemporizador();
    raiz.classList.toggle("aberto");
    raiz.querySelector(".chat-seta").className = "bi chat-seta ms-auto " + (raiz.classList.contains("aberto") ? "bi-chevron-down" : "bi-chevron-up");
  });

  mostrarTelaInicial();
})();
