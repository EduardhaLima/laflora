(() => {
  const menu = document.querySelector(".menu-conta");
  const conta = JSON.parse(sessionStorage.getItem("laflora_usuario") || "{}");
  let carregandoModais;

  function informar(modal, mensagem, sucesso = false) {
    const estado = modal.querySelector(".modal-conta-mensagem");
    estado.classList.toggle("text-danger", !sucesso);
    estado.classList.toggle("text-verde", sucesso);
    estado.textContent = mensagem;
    if (mensagem) estado.scrollIntoView({ block: "nearest" });
  }

  async function carregarPerfil() {
    const formulario = document.getElementById("form-perfil");
    const estado = document.getElementById("estado-perfil");
    formulario.hidden = true;
    estado.hidden = false;
    estado.textContent = "Carregando seu perfil…";
    const resposta = await chamarApi("perfil", null, "GET");
    if (!resposta.sucesso || !resposta.perfil) {
      estado.textContent = resposta.mensagem || "Não foi possível carregar seu perfil.";
      return;
    }

    for (const campo of ["nome", "email", "telefone"]) {
      formulario.elements.namedItem(campo).value = resposta.perfil[campo];
    }
    estado.hidden = true;
    formulario.hidden = false;
  }

  async function salvarConta(formulario, metodo, dados) {
    const botao = formulario.querySelector("button[type=submit]");
    const modal = formulario.closest("dialog");
    botao.disabled = true;
    informar(modal, "");
    const resposta = await chamarApi("perfil", dados, metodo);
    botao.disabled = false;
    informar(modal, resposta.mensagem || "Não foi possível salvar.", resposta.sucesso);
    return resposta;
  }

  function prepararFechamento(modal) {
    const foraDoPainel = (evento) => {
      if (evento.target !== modal) return false;
      const { left, right, top, bottom } = modal.getBoundingClientRect();
      return evento.clientX < left || evento.clientX > right
        || evento.clientY < top || evento.clientY > bottom;
    };

    async function fechar(evento) {
      evento.preventDefault();
      if (modal.classList.contains("fechando")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        modal.close();
        return;
      }
      modal.classList.add("fechando");
      const animacao = modal.animate(
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }],
        { duration: 160, easing: "ease-in", fill: "forwards" }
      );
      await animacao.finished.catch(() => {});
      modal.close();
      animacao.cancel();
      modal.classList.remove("fechando");
    }

    let pressionouFora = false;
    modal.addEventListener("pointerdown", (evento) => { pressionouFora = foraDoPainel(evento); });
    modal.addEventListener("click", (evento) => {
      if (pressionouFora && foraDoPainel(evento)) fechar(evento);
      pressionouFora = false;
    });
    modal.querySelector('form[method="dialog"]').addEventListener("submit", fechar);
    modal.addEventListener("cancel", fechar);
  }

  async function prepararModais() {
    const resposta = await fetch("../../assets/html/modais-conta.html?v=modal-conta-1");
    if (!resposta.ok) throw new Error("Falha ao carregar os modais de conta.");
    document.body.insertAdjacentHTML("beforeend", await resposta.text());

    const formPerfil = document.getElementById("form-perfil");
    const formSenha = document.getElementById("form-senha");
    const formDesativar = document.getElementById("form-desativar");
    const desativarConta = document.getElementById("desativar-conta");
    desativarConta.hidden = conta.papel !== "cliente";

    formPerfil.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const dados = Object.fromEntries(new FormData(formPerfil));
      const resposta = await salvarConta(formPerfil, "PUT", { ...dados, acao: "perfil" });
      if (resposta.sucesso) {
        Object.assign(conta, resposta.perfil);
        sessionStorage.setItem("laflora_usuario", JSON.stringify(conta));
      }
    });

    formSenha.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const { senha_atual, senha_nova, confirmacao } = Object.fromEntries(new FormData(formSenha));
      if (senha_nova !== confirmacao) {
        return informar(formSenha.closest("dialog"), "As novas senhas precisam ser iguais.");
      }
      const resposta = await salvarConta(formSenha, "PUT", { acao: "senha", senha_atual, senha_nova });
      if (resposta.sucesso) formSenha.reset();
    });

    formDesativar.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      if (!window.confirm("Deseja desativar sua conta e sair do site?")) return;
      const resposta = await salvarConta(formDesativar, "DELETE", Object.fromEntries(new FormData(formDesativar)));
      if (resposta.sucesso) {
        sessionStorage.removeItem("laflora_usuario");
        location.href = "../login/login.html";
      }
    });

    for (const modal of document.querySelectorAll(".modal-conta")) {
      prepararFechamento(modal);
      modal.addEventListener("close", () => {
        informar(modal, "");
        if (modal.id === "modal-configuracoes") {
          formSenha.reset();
          formDesativar.reset();
          desativarConta.open = false;
        }
        menu.querySelector("summary").focus({ preventScroll: true });
      });
    }
  }

  menu.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("[data-modal-conta]");
    if (!botao || document.querySelector(".modal-conta[open]")) return;
    menu.open = false;
    try {
      carregandoModais ??= prepararModais();
      await carregandoModais;
    } catch {
      carregandoModais = null;
      mostrarAviso("Não foi possível abrir sua conta. Tente novamente.", "erro");
      return;
    }
    if (document.querySelector(".modal-conta[open]")) return;
    document.getElementById(`modal-${botao.dataset.modalConta}`).showModal();
    if (botao.dataset.modalConta === "perfil") carregarPerfil();
  });
})();
