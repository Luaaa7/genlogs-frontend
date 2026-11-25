import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { agregarAlCarrito, carritoAbierto, cerrarCarrito } from "@/lib/carritoPublico"
import { PublicLayout } from "./PublicLayout"

vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

describe("Cabecera pública", () => {
  beforeEach(() => {
    localStorage.clear()
    cerrarCarrito()
  })

  it("«Portal de clientes» lleva al ingreso del cliente, no al registro (PS4)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Portal de clientes" }).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("tiene «Pedir cotización», Catálogo y Contacto", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toContain("#solicitud")
    expect(screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")).toContain("#catalogo")
    expect(screen.getAllByRole("link", { name: "Contacto" }).length).toBeGreaterThan(0)
  })

  it("fuera de la landing los enlaces apuntan a /#catalogo y /#solicitud", () => {
    render(<MemoryRouter initialEntries={["/portal/ingreso"]}><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")).toBe("/#catalogo")
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toBe("/#solicitud")
  })

  it("el botón «Pedir cotización» de la cabecera se esconde en celular (hidden sm:flex)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    const clases = screen.getByRole("link", { name: /Pedir cotización/ }).className.split(" ")
    expect(clases).toContain("hidden")
    expect(clases).toContain("sm:flex")
  })

  it("la cabecera y el pie llevan a Ayuda y Contacto (v3.4, K2)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    // El mismo nombre en la cabecera y en el pie (portal y menú interno también dicen «Contacto»).
    expect(screen.getAllByRole("link", { name: "Contacto" }).map((a) => a.getAttribute("href"))).toEqual(["/contacto", "/contacto"])
    expect(screen.getAllByRole("link", { name: "Ayuda" }).map((a) => a.getAttribute("href"))).toEqual(["/ayuda", "/ayuda"])
  })

  it("el pie lleva al ingreso del personal (/login) para quien usa la app o la web", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Ingreso del personal" }).getAttribute("href")).toBe("/login")
  })

  it("«Portal de clientes» se ve marcado en el ingreso del portal y no en la landing (v3.4)", () => {
    const { unmount } = render(<MemoryRouter initialEntries={["/portal/ingreso"]}><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Portal de clientes" }).getAttribute("aria-current")).toBe("page")
    unmount()
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Portal de clientes" }).getAttribute("aria-current")).toBeNull()
  })

  describe("con repuestos en el carrito de cotización", () => {
    const filtro = { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" }
    const rodamiento = { id: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS" }

    function pintarEn(ruta: string) {
      return render(
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<p>Landing</p>} />
              <Route path="/portal/ingreso" element={<p>Ingreso</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )
    }

    it("«Pedir cotización» muestra el contador de repuestos y deja de ser un enlace a #solicitud", () => {
      agregarAlCarrito(filtro)
      agregarAlCarrito(rodamiento)
      pintarEn("/")

      const boton = screen.getByRole("button", { name: /pedir cotización/i })
      expect(boton.textContent).toContain("2")
      expect(screen.queryByRole("link", { name: /pedir cotización/i })).toBeNull()
    })

    it("el contador cuenta repuestos distintos, no unidades", () => {
      agregarAlCarrito({ ...filtro, cantidad: 10 })
      pintarEn("/")
      expect(screen.getByRole("button", { name: /pedir cotización/i }).textContent).toContain("1")
    })

    it("al pulsarlo abre el carrito", () => {
      agregarAlCarrito(filtro)
      pintarEn("/")

      fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

      expect(carritoAbierto()).toBe(true)
    })

    it("desde otra página abre el carrito y lleva a la landing, donde está", () => {
      agregarAlCarrito(filtro)
      pintarEn("/portal/ingreso")

      fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

      expect(screen.getByText("Landing")).toBeTruthy()
      expect(carritoAbierto()).toBe(true)
    })

    it("sin repuestos sigue siendo el enlace de siempre, sin contador", () => {
      pintarEn("/")
      const enlace = screen.getByRole("link", { name: /pedir cotización/i })
      expect(enlace.getAttribute("href")).toContain("#solicitud")
      expect(enlace.textContent).not.toMatch(/\d/)
    })

    it("en celular sigue escondido, como el enlace original", () => {
      agregarAlCarrito(filtro)
      pintarEn("/")
      const clases = screen.getByRole("button", { name: /pedir cotización/i }).className.split(" ")
      expect(clases).toContain("hidden")
      expect(clases).toContain("sm:flex")
    })
  })
})
