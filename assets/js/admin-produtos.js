exigirAdmin();
Carrinho.atualizarBadge();
document.getElementById("btn-sair").addEventListener("click", sair);

const tbody = document.getElementById("tabela-produtos");
const modal = new bootstrap.Modal(document.getElementById("modal-produto"));
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
        ${p.ativo ? `<button class="btn btn-sm btn-outline-danger" data-desativar="${escaparHtml(p.id)}">
          <i class="bi bi-trash"></i> Desativar
        </button>` : ""}
      </td>
    </tr>
  `).join("");
}

async function carregarProdutosAdmin() {
  const r = await chamarApi("produtos", { modo: "admin" }, "GET");
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
  const campoId = document.getElementById("prod-id");
  campoId.readOnly = false;
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
    const campoId = document.getElementById("prod-id");
    campoId.value = p.id;
    campoId.readOnly = true;
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

  const btnDesativar = e.target.closest("[data-desativar]");
  if (btnDesativar) {
    const id = btnDesativar.dataset.desativar;
    if (!confirm(`Deseja realmente desativar o produto "${id}"?`)) return;
    const r = await chamarApi("produtos", { id }, "DELETE");
    if (r.sucesso) {
      mostrarAviso(r.mensagem || "Produto desativado.", "sucesso");
      carregarProdutosAdmin();
    } else {
      mostrarAviso(r.mensagem || "Erro ao desativar produto.", "erro");
    }
  }
});

document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    id: document.getElementById("prod-id").value.trim(),
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

carregarProdutosAdmin();