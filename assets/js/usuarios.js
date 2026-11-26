exigirAdmin();
Carrinho.atualizarBadge();
document.getElementById("btn-sair").addEventListener("click", sair);

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
        ${u.ativo ? `<button class="btn btn-sm btn-outline-danger" data-desativar="${u.id}">
          <i class="bi bi-person-slash"></i> Desativar
        </button>` : ""}
      </td>
    </tr>
  `).join("");
}

async function carregarUsuarios(busca = "") {
  const params = busca ? { busca } : null;
  const r = await chamarApi("usuarios", params, "GET");
  if (!r.sucesso || !Array.isArray(r.usuarios)) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${escaparHtml(r.mensagem || "Erro ao carregar usuários.")}</td></tr>`;
    return;
  }
  usuariosLista = r.usuarios;
  renderizarUsuarios(usuariosLista);
}

let timerBusca;
document.getElementById("busca-usuarios").addEventListener("input", (e) => {
  clearTimeout(timerBusca);
  timerBusca = setTimeout(() => carregarUsuarios(e.target.value.trim()), 250);
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
    document.getElementById("usr-ativo").checked = Boolean(u.ativo);
    document.getElementById("usr-senha").value = "";
    modal.show();
    return;
  }

  const btnDesativar = e.target.closest("[data-desativar]");
  if (btnDesativar) {
    const id = Number(btnDesativar.dataset.desativar);
    if (!confirm("Deseja realmente desativar este usuário?")) return;
    const r = await chamarApi("usuarios", { id }, "DELETE");
    if (r.sucesso) {
      mostrarAviso(r.mensagem || "Usuário desativado.", "sucesso");
      carregarUsuarios(document.getElementById("busca-usuarios").value.trim());
    } else {
      mostrarAviso(r.mensagem || "Erro ao desativar usuário.", "erro");
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
    ativo: document.getElementById("usr-ativo").checked,
  };
  const senha = document.getElementById("usr-senha").value;
  if (senha) payload.senha = senha;

  const r = await chamarApi("usuarios", payload, "PUT");
  if (r.sucesso) {
    mostrarAviso(r.mensagem || "Usuário atualizado.", "sucesso");
    modal.hide();
    carregarUsuarios(document.getElementById("busca-usuarios").value.trim());
  } else {
    mostrarAviso(r.mensagem || "Erro ao atualizar usuário.", "erro");
  }
});

carregarUsuarios();