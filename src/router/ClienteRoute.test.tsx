import { render, screen } from "@testing-library/react"
import { describe, expect, it, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ClienteRoute } from "./ClienteRoute"
import { ClienteLayout } from "@/layouts/ClienteLayout"
import { cerrarSesionCliente, cerrarSesionInterna } from "@/lib/sesiones"

function renderGuard() {
  return render(<MemoryRouter initialEntries={["/portal/pedidos"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/pedidos" element={<div>Pedidos privados</div>} /></Route><Route path="/portal/registro" element={<div>Registro</div>} /></Routes></MemoryRouter>)
}

function renderPortalLayout() {
  return render(<MemoryRouter initialEntries={["/portal/pedidos"]}><Routes><Route element={<ClienteLayout />}><Route path="/portal/pedidos" element={<div>Pedidos privados</div>} /><Route path="/portal/registro" element={<div>Registro</div>} /></Route></Routes></MemoryRouter>)
}

describe("ClienteRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("redirige al registro sin sesión de cliente", () => {
    renderGuard()
    expect(screen.getByText("Registro")).toBeTruthy()
  })

  it("permite el portal con token y sesión de cliente", () => {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Cliente", rol: "CLIENTE" }))
    renderGuard()
    expect(screen.getByText("Pedidos privados")).toBeTruthy()
  })

  it("rechaza el portal cuando también existe una sesión interna", () => {
    localStorage.setItem("cliente_access_token", "cliente")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ rol: "CLIENTE" }))
    localStorage.setItem("access_token", "interno")
    sessionStorage.setItem("genlogs-auth", JSON.stringify({ state: { token: "interno", nombreRol: "ADMINISTRADOR" } }))
    renderGuard()
    expect(screen.getByText("Registro")).toBeTruthy()
  })

  it("cerrar sesión del portal conserva la sesión interna", () => {
    localStorage.setItem("cliente_access_token", "cliente")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ rol: "CLIENTE" }))
    localStorage.setItem("access_token", "interno")
    localStorage.setItem("refresh_token", "refresh")
    sessionStorage.setItem("genlogs-auth", JSON.stringify({ state: { token: "interno", nombreRol: "ADMINISTRADOR" } }))
    renderPortalLayout()
    screen.getByRole("button", { name: "Cerrar sesión" }).click()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
    expect(sessionStorage.getItem("genlogs-cliente-auth")).toBeNull()
    expect(localStorage.getItem("access_token")).toBe("interno")
    expect(localStorage.getItem("refresh_token")).toBe("refresh")
    expect(sessionStorage.getItem("genlogs-auth")).not.toBeNull()
  })

  it("cerrar sesión interna conserva la sesión del portal", () => {
    localStorage.setItem("cliente_access_token", "cliente")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ rol: "CLIENTE" }))
    localStorage.setItem("access_token", "interno")
    localStorage.setItem("refresh_token", "refresh")
    sessionStorage.setItem("genlogs-auth", JSON.stringify({ state: { token: "interno", nombreRol: "ADMINISTRADOR" } }))
    cerrarSesionInterna()
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
    expect(sessionStorage.getItem("genlogs-auth")).toBeNull()
    expect(localStorage.getItem("cliente_access_token")).toBe("cliente")
    expect(sessionStorage.getItem("genlogs-cliente-auth")).not.toBeNull()
    cerrarSesionCliente()
  })
})
