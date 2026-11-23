import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"

const api = vi.hoisted(() => ({ listarCategoriasVitrina: vi.fn() }))
vi.mock("@/api/publicApi", () => ({ publicApi: api }))

import { PublicLayout } from "@/layouts/PublicLayout"
import { Portada } from "./Portada"

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Routes><Route element={<PublicLayout />}><Route index element={<Portada />} /></Route></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Portada", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listarCategoriasVitrina.mockResolvedValue([
      { idCategoria: 1, nombre: "A", cantidad: 4 },
      { idCategoria: 2, nombre: "B", cantidad: 5 },
      { idCategoria: 3, nombre: "C", cantidad: 1 },
    ])
  })

  it("el botón que va a /portal/registro dice «Crear cuenta»", () => {
    pintar()
    const botones = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/portal/registro")
    expect(botones).toHaveLength(1)
    expect(botones[0].textContent).toBe("Crear cuenta")
  })

  it("el único «Ingresar» va a /portal/ingreso", () => {
    pintar()
    const ingresar = screen.getAllByRole("link", { name: "Ingresar" })
    expect(ingresar).toHaveLength(1)
    expect(ingresar[0].getAttribute("href")).toBe("/portal/ingreso")
  })

  it("ya no muestra «24/7» ni «360°»", () => {
    const { container } = pintar()
    expect(container.textContent).not.toContain("24/7")
    expect(container.textContent).not.toContain("360°")
  })

  it("la vista previa «Así verás tu pedido» es aria-hidden y marca «Cotizada» como paso actual", () => {
    const { container } = pintar()
    const vista = container.querySelector("[data-vista-previa]")
    expect(vista).not.toBeNull()
    expect(vista?.getAttribute("aria-hidden")).toBe("true")
    expect(vista?.textContent).toContain("Así verás tu pedido")
    for (const paso of ["Recibida", "En búsqueda", "Cotizada", "En camino"]) expect(vista?.textContent).toContain(paso)
    expect(vista?.querySelector('[aria-current="step"]')?.textContent).toContain("Cotizada")
  })

  it("el número de repuestos sale de los datos (3 categorías que suman 10)", async () => {
    pintar()
    expect(await screen.findByText("10 repuestos en catálogo")).toBeTruthy()
  })

  it("sin datos de categorías no inventa el número de repuestos", async () => {
    api.listarCategoriasVitrina.mockRejectedValue(new Error("x"))
    const { container } = pintar()
    await screen.findByText("Sigue tu pedido en el portal")
    expect(container.textContent).not.toContain("repuestos en catálogo")
  })

  it("se ven los tres datos y no aparece la palabra «día»", async () => {
    const { container } = pintar()
    await screen.findByText("10 repuestos en catálogo")
    expect(screen.getByText("Precio y plazo confirmados en cada cotización")).toBeTruthy()
    expect(screen.getByText("Sigue tu pedido en el portal")).toBeTruthy()
    expect(container.textContent?.toLowerCase()).not.toMatch(/\bd[ií]as?\b/)
  })
})
