import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { describe, expect, it, beforeEach, vi } from "vitest"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { ClienteRoute } from "./ClienteRoute"
import { ClienteLayout } from "@/layouts/ClienteLayout"
import { cerrarSesionCliente, cerrarSesionInterna } from "@/lib/sesiones"

// El menú de cuenta del marco pide los datos de la cuenta: se simulan y se da un QueryClient.
vi.mock("@/features/acceso-cliente/api/ingresoGoogleApi", async (original) => ({
  ...(await original<typeof import("@/features/acceso-cliente/api/ingresoGoogleApi")>()),
  obtenerCuentaPortal: vi.fn().mockResolvedValue({ nombre: "Cliente", correo: "cliente@empresa.pe", perfilCompleto: true, empresa: "Empresa" }),
}))
function ConProveedor({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
}

function VerRuta() {
  const l = useLocation()
  return <div>{l.pathname + l.search}</div>
}

function renderGuard() {
  return render(<MemoryRouter initialEntries={["/portal/pedidos"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/pedidos" element={<div>Pedidos privados</div>} /></Route><Route path="/portal/ingreso" element={<div>Ingreso</div>} /></Routes></MemoryRouter>, { wrapper: ConProveedor })
}

function renderPortalLayout() {
  return render(<MemoryRouter initialEntries={["/portal/pedidos"]}><Routes><Route element={<ClienteLayout />}><Route path="/portal/pedidos" element={<div>Pedidos privados</div>} /><Route path="/portal/ingreso" element={<div>Ingreso</div>} /></Route></Routes></MemoryRouter>, { wrapper: ConProveedor })
}

describe("ClienteRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("redirige al ingreso del cliente sin sesión", () => {
    renderGuard()
    expect(screen.getByText("Ingreso")).toBeTruthy()
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
    expect(screen.getByText("Ingreso")).toBeTruthy()
  })

  it("cerrar sesión del portal conserva la sesión interna", () => {
    localStorage.setItem("cliente_access_token", "cliente")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ rol: "CLIENTE" }))
    localStorage.setItem("access_token", "interno")
    localStorage.setItem("refresh_token", "refresh")
    sessionStorage.setItem("genlogs-auth", JSON.stringify({ state: { token: "interno", nombreRol: "ADMINISTRADOR" } }))
    renderPortalLayout()
    fireEvent.click(screen.getByRole("button", { name: "Menú de cuenta" }))
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }))
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

  it("cuenta de Google sin empresa: navega el portal y ve cómo pedir su primera cotización", () => {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Gina", rol: "CLIENTE", perfilCompleto: false }))
    render(<MemoryRouter initialEntries={["/portal/pedidos"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/pedidos" element={<div>Pedidos privados</div>} /></Route></Routes></MemoryRouter>, { wrapper: ConProveedor })
    expect(screen.queryByText("Pedidos privados")).toBeNull()
    expect(screen.getByText("Aún no tienes pedidos")).toBeTruthy()
    expect(screen.getByText("Hola, Gina")).toBeTruthy()
    // Se ve dentro del portal: con su barra, el logo y su menú de cuenta.
    expect(screen.getByRole("navigation", { name: "Portal del cliente" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Menú de cuenta" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Pedir mi primera cotización" }).getAttribute("href")).toBe("/portal/solicitud")
  })

  it("cuenta de Google sin empresa: al pedir una cotización le pide los datos de la empresa con ?volver=", () => {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Gina", rol: "CLIENTE", perfilCompleto: false }))
    render(<MemoryRouter initialEntries={["/portal/solicitud"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/solicitud" element={<div>Formulario solicitud</div>} /><Route path="/portal/empresa" element={<VerRuta />} /></Route></Routes></MemoryRouter>, { wrapper: ConProveedor })
    expect(screen.getByText("/portal/empresa?volver=%2Fportal%2Fsolicitud")).toBeTruthy()
  })

  it("cuenta de Google sin empresa: puede abrir su perfil (ahí encuentra cómo completar la empresa)", () => {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Gina", rol: "CLIENTE", perfilCompleto: false }))
    render(<MemoryRouter initialEntries={["/portal/perfil"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/perfil" element={<div>Mi perfil de prueba</div>} /></Route></Routes></MemoryRouter>, { wrapper: ConProveedor })
    expect(screen.getByText("Mi perfil de prueba")).toBeTruthy()
  })

  it("en la página de datos de la empresa no redirige a sí misma", () => {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Gina", rol: "CLIENTE", perfilCompleto: false }))
    render(<MemoryRouter initialEntries={["/portal/empresa"]}><Routes><Route element={<ClienteRoute />}><Route path="/portal/empresa" element={<div>Formulario empresa</div>} /></Route></Routes></MemoryRouter>, { wrapper: ConProveedor })
    expect(screen.getByText("Formulario empresa")).toBeTruthy()
  })
})
