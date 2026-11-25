import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"

vi.mock("@/api/publicApi", () => ({ publicApi: { listarCategoriasVitrina: vi.fn().mockResolvedValue([]) } }))
vi.mock("./components/PorQue", () => ({ PorQue: () => null }))
vi.mock("./components/ComoFunciona", () => ({ ComoFunciona: () => null }))
vi.mock("./components/CatalogoReferencia", () => ({ CatalogoReferencia: () => <section data-testid="catalogo-interno" /> }))
vi.mock("./components/VitrinaLanding", () => ({ VitrinaLanding: () => <section data-testid="catalogo-interno" /> }))
vi.mock("./components/CoberturaMinera", () => ({ CoberturaMinera: () => null }))
vi.mock("./components/Respaldo", () => ({ Respaldo: () => null }))
vi.mock("./components/SolicitudRapida", () => ({ SolicitudRapida: () => null }))

import { LandingPage } from "./LandingPage"

describe("LandingPage", () => {
  it("«Ver catálogo» apunta a #catalogo y ese id envuelve el catálogo", () => {
    const qc = new QueryClient()
    const { container } = render(<QueryClientProvider client={qc}><MemoryRouter><LandingPage /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByRole("link", { name: /Ver catálogo/ }).getAttribute("href")).toContain("#catalogo")
    const destino = container.querySelector("#catalogo")
    expect(destino).not.toBeNull()
    expect(destino?.querySelector('[data-testid="catalogo-interno"]')).not.toBeNull()
  })

  it("no muestra la franja «¿Listo para simplificar tu abastecimiento?» antes del pie (v3.4)", () => {
    const qc = new QueryClient()
    render(<QueryClientProvider client={qc}><MemoryRouter><LandingPage /></MemoryRouter></QueryClientProvider>)
    expect(screen.queryByText(/Listo para simplificar/)).toBeNull()
  })
})
