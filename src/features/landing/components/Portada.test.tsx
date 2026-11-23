import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"

const api = vi.hoisted(() => ({ listarCategoriasVitrina: vi.fn() }))
vi.mock("@/api/publicApi", () => ({ publicApi: api }))
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

import { PublicLayout } from "@/layouts/PublicLayout"
import { Portada } from "./Portada"

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<><Portada /><section id="solicitud"><input id="sr-marca" aria-label="Marca" /></section></>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Portada", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listarCategoriasVitrina.mockResolvedValue([
      { idCategoria: 1, nombre: "Válvulas", cantidad: 4 },
      { idCategoria: 2, nombre: "Filtros", cantidad: 5 },
      { idCategoria: 3, nombre: "Engranajes", cantidad: 1 },
    ])
  })

  it("el h1 tiene el texto fijo para lectores de pantalla y la parte animada va oculta", () => {
    pintar()
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(h1.textContent).toContain("Repuestos, servicios y fabricaciones que llegan a tu operación")
    expect(h1.querySelector(".sr-only")?.textContent).toBe("Repuestos, servicios y fabricaciones que llegan a tu operación")
    expect(h1.querySelector('[aria-hidden="true"]')?.textContent).toContain("Fabricaciones")
  })

  it("la escena del camión es aria-hidden", () => {
    const { container } = pintar()
    const escena = container.querySelector("[data-escena-camion]")
    expect(escena).not.toBeNull()
    expect(escena?.getAttribute("aria-hidden")).toBe("true")
    expect(escena?.getAttribute("class")?.split(" ")).toEqual(expect.arrayContaining(["hidden", "md:block"]))
  })

  it("«Pedir cotización» del hero apunta a la solicitud y le da el foco al primer campo", () => {
    pintar()
    const boton = screen.getAllByRole("link", { name: /Pedir cotización/ }).find((a) => a.hasAttribute("data-hero-cta"))!
    expect(boton.getAttribute("href")).toContain("#solicitud")
    fireEvent.click(boton)
    expect(document.activeElement?.id).toBe("sr-marca")
  })

  it("«Ver catálogo →» baja al catálogo y se lee «Sin compromiso · Precio y plazo confirmados»", () => {
    const { container } = pintar()
    expect(screen.getByRole("link", { name: /Ver catálogo/ }).getAttribute("href")).toContain("#catalogo")
    expect(container.textContent).toContain("Sin compromiso · Precio y plazo confirmados")
  })

  it("la franja muestra las categorías y sus cantidades de los datos", async () => {
    pintar()
    expect((await screen.findAllByText("Válvulas")).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Filtros").length).toBeGreaterThan(0)
    expect(screen.getAllByText("5").length).toBeGreaterThan(0)
  })

  it("si fallan los datos la franja no aparece", async () => {
    api.listarCategoriasVitrina.mockRejectedValue(new Error("x"))
    pintar()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByLabelText("Categorías del catálogo")).toBeNull()
  })

  it("no aparecen «24/7» ni «360°»", async () => {
    const { container } = pintar()
    await screen.findAllByText("Válvulas")
    expect(container.textContent).not.toContain("24/7")
    expect(container.textContent).not.toContain("360°")
  })
})
