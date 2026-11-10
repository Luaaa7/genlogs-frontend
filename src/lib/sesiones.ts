export function cerrarSesionInterna() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  sessionStorage.removeItem("genlogs-auth")
}

export function cerrarSesionCliente() {
  localStorage.removeItem("cliente_access_token")
  sessionStorage.removeItem("genlogs-cliente-auth")
}
