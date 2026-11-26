import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { FallbackPublico } from "./FallbackPublico"
import { perezosa } from "./perezosa"

describe("FallbackPublico", () => {
  it("muestra una barra fina arriba y el emblema, y avisa a los lectores de pantalla", () => {
    render(<FallbackPublico />)
    const aviso = screen.getByRole("status")
    expect(aviso.textContent).toContain("Cargando…")
    const barra = screen.getByTestId("barra-carga")
    expect(barra.className).toContain("fixed")
    expect(barra.className).toContain("top-0")
    expect(barra.getAttribute("aria-hidden")).toBe("true")
    expect(screen.getByTestId("emblema-carga")).toBeTruthy()
  })

  it("la barra y el emblema respetan «movimiento reducido»", () => {
    render(<FallbackPublico />)
    expect(screen.getByTestId("barra-carga").innerHTML).toContain("motion-reduce")
    expect(screen.getByTestId("emblema-carga").className).toContain("motion-reduce:animate-none")
  })
})

describe("perezosa en rutas públicas", () => {
  function pagina() {
    let resolver!: (m: { Pagina: () => React.ReactElement }) => void
    const cargar = () => new Promise<{ Pagina: () => React.ReactElement }>((r) => { resolver = r })
    return { cargar, resolver: (m: { Pagina: () => React.ReactElement }) => resolver(m) }
  }

  it("con publica: true muestra el fallback ligero mientras carga y lo quita al resolver", async () => {
    const { cargar, resolver } = pagina()
    const Perezosa = perezosa(cargar, "Pagina", { publica: true })
    render(<Perezosa />)
    expect(screen.getByTestId("barra-carga")).toBeTruthy()

    await act(async () => resolver({ Pagina: () => <p>Página lista</p> }))
    expect(await screen.findByText("Página lista")).toBeTruthy()
    expect(screen.queryByTestId("barra-carga")).toBeNull()
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("sin la opción conserva el aviso sencillo de las vistas internas", async () => {
    const { cargar, resolver } = pagina()
    const Perezosa = perezosa(cargar, "Pagina")
    render(<Perezosa />)
    expect(screen.getByRole("status").textContent).toContain("Cargando…")
    expect(screen.queryByTestId("barra-carga")).toBeNull()

    await act(async () => resolver({ Pagina: () => <p>Interna lista</p> }))
    expect(await screen.findByText("Interna lista")).toBeTruthy()
  })
})
