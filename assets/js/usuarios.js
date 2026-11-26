exigirAdmin();
Carrinho.atualizarBadge();
document.getElementById("btn-sair").addEventListener("click", sair);

const campoBusca = document.getElementById("busca-usuarios");
const tbody = document.getElementById("tabela-usuarios");
const modalEl = document.getElementById("modal-usuario");
const modal = new bootstrap.Modal(modalEl);
let usuariosLista = [];

function renderizarUsuarios(lista) {
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-suave py-4">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map((u) => `
    <tr>
      <td>#${u.id}</td>
      <td>${escaparHtml(u.nome)}</td>
      <td>${escaparHtml(u.email)}</td>
      <td>${escaparHtml(u.telefone)}</td>
      <td><span class="badge ${u.papel === "admin" ? "bg-dark" : "bg-secondary"}">${escaparHtml(u.papel)}</span></td>
      <td><span class="badge ${u.ativo ? "bg-success" : "bg-danger"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-success me-1" data-editar="${u.id}">
          <i class="bi bi-pencil"></i> Editar
        </button>
        <button class="btn btn-sm btn-outline-danger" data-excluir="${u.id}">
          <i class="bi bi-trash"></i> Excluir
        </button>
      </td>
    </tr>
  `).join("");
}

async function carregarUsuarios() {
  const busca = campoBusca.value.trim();
  const params = busca ? { busca } : null;
  const r = await chamarApi("usuarios", params, "GET");
  if (busca !== campoBusca.value.trim()) return;
  if (!r.sucesso || !Array.isArray(r.usuarios)) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${escaparHtml(r.mensagem || "Erro ao carregar usuários.")}</td></tr>`;
    return;
  }
  usuariosLista = r.usuarios;
  renderizarUsuarios(usuariosLista);
}

let timerBusca;
campoBusca.addEventListener("input", () => {
  clearTimeout(timerBusca);
  timerBusca = setTimeout(carregarUsuarios, 250);
});

tbody.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest("[data-editar]");
  if (btnEditar) {
    const u = usuariosLista.find((item) => item.id === Number(btnEditar.dataset.editar));
    if (!u) return;
    document.getElementById("usr-id").value = u.id;
    document.getElementById("usr-nome").value = u.nome;
    document.getElementById("usr-email").value = u.email;
    document.getElementById("usr-telefone").value = u.telefone;
    document.getElementById("usr-nascimento").value = u.nascimento;
    document.getElementById("usr-papel").value = u.papel;
    document.getElementById("usr-senha").value = "";
    modal.show();
    return;
  }

  const btnExcluir = e.target.closest("[data-excluir]");
  if (btnExcluir) {
    const id = Number(btnExcluir.dataset.excluir);
    if (!confirm("Excluir este usuário definitivamente? Esta ação não pode ser desfeita.")) return;
    const r = await chamarApi("usuarios", { id }, "DELETE");
    if (r.sucesso) {
      mostrarAviso(r.mensagem || "Usuário excluído.", "exclusao");
      carregarUsuarios();
    } else {
      mostrarAviso(r.mensagem || "Erro ao excluir usuário.", "erro");
    }
  }
});

document.getElementById("form-usuario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    id: Number(document.getElementById("usr-id").value),
    nome: document.getElementById("usr-nome").value.trim(),
    email: document.getElementById("usr-email").value.trim(),
    telefone: document.getElementById("usr-telefone").value.replace(/\D/g, ""),
    nascimento: document.getElementById("usr-nascimento").value,
    papel: document.getElementById("usr-papel").value,
  };
  const senha = document.getElementById("usr-senha").value;
  if (senha) payload.senha = senha;

  const r = await chamarApi("usuarios", payload, "PUT");
  if (r.sucesso) {
    mostrarAviso(r.mensagem || "Usuário atualizado.", "sucesso");
    modal.hide();
    carregarUsuarios();
  } else {
    mostrarAviso(r.mensagem || "Erro ao atualizar usuário.", "erro");
  }
});

carregarUsuarios();