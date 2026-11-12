import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

async function renderLayout(vitrina: boolean) {
  vi.resetModules()
  vi.doMock("@/lib/interruptores", () => ({ vitrinaHabilitada: vitrina }))
  const { ClienteLayout } = await import("./ClienteLayout")
  return render(<MemoryRouter><ClienteLayout /></MemoryRouter>)
}

describe("Menú del portal del cliente", () => {
  afterEach(() => vi.doUnmock("@/lib/interruptores"))

  it("siempre muestra Mis pedidos, Mis cotizaciones, Nueva solicitud y Reclamos", async () => {
    await renderLayout(false)
    expect(screen.getByRole("link", { name: "Mis pedidos" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Mis cotizaciones" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Nueva solicitud" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Reclamos" }).getAttribute("href")).toBe("/portal/reclamos")
  })

  it("con la vitrina apagada no muestra Repuestos", async () => {
    await renderLayout(false)
    expect(screen.queryByRole("link", { name: "Repuestos" })).toBeNull()
  })

  it("con la vitrina encendida muestra Repuestos (#59 de Nicole)", async () => {
    await renderLayout(true)
    const enlace = screen.getByRole("link", { name: "Repuestos" })
    expect(enlace.getAttribute("href")).toBe("/portal/repuestos")
  })
})
