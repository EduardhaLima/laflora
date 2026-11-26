/* Avisos das ações do site (Bootstrap Toast). */
function mostrarAviso(mensagem, tipo = "sucesso") {
  let area = document.getElementById("area-avisos");
  if (!area) {
    area = document.createElement("div");
    area.id = "area-avisos";
    area.className = "toast-container position-fixed top-0 end-0 p-3";
    area.style.zIndex = 2000;
    document.body.appendChild(area);
  }
  const icones = {
    sucesso: "bi-check-circle-fill",
    desativacao: "bi-exclamation-triangle-fill",
    exclusao: "bi-trash-fill",
    erro: "bi-exclamation-octagon-fill",
  };
  const icone = icones[tipo];
  const el = document.createElement("div");
  el.className = `toast align-items-center border-0 toast-${tipo}`;
  el.setAttribute("role", "alert");
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icone} me-2"></i></div>
    <button type="button" class="btn-close ${tipo === "desativacao" ? "" : "btn-close-white"} me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  el.querySelector(".toast-body").append(document.createTextNode(mensagem));
  area.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 });
  t.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}
