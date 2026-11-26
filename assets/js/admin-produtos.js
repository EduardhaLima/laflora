exigirAdmin();
Carrinho.atualizarBadge();
document.getElementById("btn-sair").addEventListener("click", sair);

const campoBusca = document.getElementById("busca-produtos");
const tbody = document.getElementById("tabela-produtos");
const modal = new bootstrap.Modal(document.getElementById("modal-produto"));
const janelaExclusao = document.getElementById("modal-excluir-produto");
const modalExclusao = new bootstrap.Modal(janelaExclusao);
const confirmarExclusao = document.getElementById("confirmar-exclusao-produto");
const erroExclusao = document.getElementById("erro-exclusao-produto");
let produtoParaExcluir;
let produtosAdmin = [];
let modoEdicao = false;

function renderizarTabela() {
  if (!produtosAdmin.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-suave py-4">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = produtosAdmin.map((p) => `
    <tr>
      <td><code>${escaparHtml(p.id)}</code></td>
      <td>${escaparHtml(p.nome)}</td>
      <td>${escaparHtml(p.categoria)}</td>
      <td>${escaparHtml(p.evento || "-")} / ${escaparHtml(p.sentimento || "-")}</td>
      <td class="fw-bold text-verde">${brl(p.preco)}</td>
      <td><span class="badge ${p.ativo ? "bg-success" : "bg-danger"}">${p.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-success me-1" data-editar="${escaparHtml(p.id)}">
          <i class="bi bi-pencil"></i> Editar
        </button>
        ${p.ativo ? `<button class="btn btn-sm btn-outline-laranja me-1" data-desativar="${escaparHtml(p.id)}">
          <i class="bi bi-eye-slash"></i> Desativar
        </button>` : ""}
        <button class="btn btn-sm btn-outline-danger" data-excluir="${escaparHtml(p.id)}">
          <i class="bi bi-trash"></i> Excluir
        </button>
      </td>
    </tr>
  `).join("");
}

async function carregarProdutosAdmin() {
  const busca = campoBusca.value.trim();
  const r = await chamarApi("produtos", { modo: "admin", busca }, "GET");
  if (busca !== campoBusca.value.trim()) return;
  if (!r.sucesso || !Array.isArray(r.produtos)) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${escaparHtml(r.mensagem || "Erro ao carregar produtos.")}</td></tr>`;
    return;
  }
  produtosAdmin = r.produtos;
  renderizarTabela();
}

document.getElementById("btn-novo-produto").addEventListener("click", () => {
  modoEdicao = false;
  document.getElementById("titulo-modal-produto").textContent = "Novo Produto";
  document.getElementById("form-produto").reset();
  document.getElementById("campo-id-produto").hidden = true;
  document.getElementById("prod-ativo").checked = true;
  modal.show();
});

tbody.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest("[data-editar]");
  if (btnEditar) {
    const p = produtosAdmin.find((item) => item.id === btnEditar.dataset.editar);
    if (!p) return;
    modoEdicao = true;
    document.getElementById("titulo-modal-produto").textContent = "Editar Produto";
    document.getElementById("campo-id-produto").hidden = false;
    document.getElementById("prod-id").value = p.id;
    document.getElementById("prod-nome").value = p.nome;
    document.getElementById("prod-descricao").value = p.descricao;
    document.getElementById("prod-preco").value = p.preco;
    document.getElementById("prod-categoria").value = p.categoria;
    document.getElementById("prod-img").value = p.img || "";
    document.getElementById("prod-evento").value = p.evento || "";
    document.getElementById("prod-sentimento").value = p.sentimento || "";
    document.getElementById("prod-ativo").checked = Boolean(p.ativo);
    modal.show();
    return;
  }

  const btnExcluir = e.target.closest("[data-excluir]");
  if (btnExcluir) {
    produtoParaExcluir = produtosAdmin.find((produto) => produto.id === btnExcluir.dataset.excluir);
    if (!produtoParaExcluir) return;
    document.getElementById("nome-produto-exclusao").textContent = produtoParaExcluir.nome;
    erroExclusao.hidden = true;
    modalExclusao.show(btnExcluir);
    return;
  }

  const btnDesativar = e.target.closest("[data-desativar]");
  if (btnDesativar) {
    const id = btnDesativar.dataset.desativar;
    if (!confirm(`Deseja realmente desativar o produto "${id}"?`)) return;
    const r = await chamarApi("produtos", { id }, "DELETE");
    if (r.sucesso) {
      mostrarAviso(r.mensagem || "Produto desativado.", "desativacao");
      carregarProdutosAdmin();
    } else {
      mostrarAviso(r.mensagem || "Erro ao desativar produto.", "erro");
    }
  }
});

janelaExclusao.addEventListener("hide.bs.modal", (evento) => {
  if (confirmarExclusao.disabled) evento.preventDefault();
});

confirmarExclusao.addEventListener("click", async () => {
  if (!produtoParaExcluir) return;
  confirmarExclusao.disabled = true;
  erroExclusao.hidden = true;
  const r = await chamarApi("produtos", { id: produtoParaExcluir.id, definitivo: true }, "DELETE");
  confirmarExclusao.disabled = false;
  if (!r.sucesso) {
    erroExclusao.textContent = r.mensagem || "Erro ao excluir produto.";
    erroExclusao.hidden = false;
    return;
  }
  modalExclusao.hide();
  mostrarAviso(r.mensagem || "Produto excluído.", "exclusao");
  carregarProdutosAdmin();
});

document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    ...(modoEdicao && { id: document.getElementById("prod-id").value }),
    nome: document.getElementById("prod-nome").value.trim(),
    descricao: document.getElementById("prod-descricao").value.trim(),
    preco: Number(document.getElementById("prod-preco").value),
    categoria: document.getElementById("prod-categoria").value,
    img: document.getElementById("prod-img").value.trim(),
    evento: document.getElementById("prod-evento").value,
    sentimento: document.getElementById("prod-sentimento").value,
    ativo: document.getElementById("prod-ativo").checked,
  };

  const r = await chamarApi("produtos", payload, modoEdicao ? "PUT" : "POST");
  if (r.sucesso) {
    mostrarAviso(r.mensagem || "Produto salvo.", "sucesso");
    modal.hide();
    carregarProdutosAdmin();
  } else {
    mostrarAviso(r.mensagem || "Erro ao salvar produto.", "erro");
  }
});

let timerBusca;
campoBusca.addEventListener("input", () => {
  clearTimeout(timerBusca);
  timerBusca = setTimeout(carregarProdutosAdmin, 250);
});

carregarProdutosAdmin();