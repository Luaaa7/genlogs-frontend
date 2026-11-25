import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/features/auth/store/authStore"
import { AyudaLayout } from "./AyudaLayout"

// Solo importa qué marco se elige; los marcos reales tienen sus propias pruebas.
vi.mock("@/layouts/AppLayout", () => ({ AppLayout: () => <div>marco-interno</div> }))
vi.mock("@/layouts/ClienteLayout", () => ({ ClienteLayout: () => <div>marco-cliente</div> }))
vi.mock("@/layouts/PublicLayout", () => ({ PublicLayout: () => <div>marco-publico</div> }))

function abrirSesionInterna() {
  localStorage.setItem("access_token", "token")
  useAuthStore.setState({ token: "token" })
}

function abrirSesionCliente() {
  localStorage.setItem("cliente_access_token", "token")
  sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Cliente", rol: "CLIENTE" }))
}

describe("Marco de Ayuda y Contacto", () => {
  // Primero se vacía el estado (el store guarda copia en sessionStorage) y luego el almacenamiento.
  function limpiar() {
    useAuthStore.setState({ token: null })
    localStorage.clear()
    sessionStorage.clear()
  }
  beforeEach(limpiar)
  afterEach(limpiar)

  it("sin sesión usa la cabecera pública", () => {
    render(<MemoryRouter><AyudaLayout /></MemoryRouter>)
    expect(screen.getByText("marco-publico")).toBeTruthy()
  })

  it("con sesión del personal se ve dentro del sistema", () => {
    abrirSesionInterna()
    render(<MemoryRouter><AyudaLayout /></MemoryRouter>)
    expect(screen.getByText("marco-interno")).toBeTruthy()
  })

  it("con sesión de cliente se ve dentro del portal", () => {
    abrirSesionCliente()
    render(<MemoryRouter><AyudaLayout /></MemoryRouter>)
    expect(screen.getByText("marco-cliente")).toBeTruthy()
  })

  it("si hay restos de una sesión del personal sin token en memoria, no abre el sistema", () => {
    localStorage.setItem("access_token", "token")
    render(<MemoryRouter><AyudaLayout /></MemoryRouter>)
    expect(screen.getByText("marco-publico")).toBeTruthy()
  })
})
