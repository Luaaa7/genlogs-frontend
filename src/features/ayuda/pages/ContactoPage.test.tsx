import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { ContactoPage } from "./ContactoPage"
import { DATOS_GENLOGS, datosConValor } from "../lib/datosGenlogs"

describe("Contáctame (v3.4, K2)", () => {
  it("muestra el correo de ventas y el enlace a la Solicitud rápida", () => {
    render(<MemoryRouter><ContactoPage /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "ventas1@genlogsac.com" }).getAttribute("href")).toBe("mailto:ventas1@genlogsac.com")
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toBe("/#solicitud")
    expect(screen.getByRole("link", { name: "Revisa la Ayuda" }).getAttribute("href")).toBe("/ayuda")
  })

  it("no tiene formulario (decisión de Luana, 21/11)", () => {
    const { container } = render(<MemoryRouter><ContactoPage /></MemoryRouter>)
    expect(container.querySelector("form")).toBeNull()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("no muestra los datos que todavía no están confirmados", () => {
    render(<MemoryRouter><ContactoPage /></MemoryRouter>)
    for (const dato of DATOS_GENLOGS.filter((d) => d.valor === null)) {
      expect(screen.queryByText(dato.etiqueta)).toBeNull()
    }
  })

  it("datosConValor deja fuera los vacíos", () => {
    const lista = datosConValor([
      { ...DATOS_GENLOGS[0] },
      { ...DATOS_GENLOGS[1], valor: "  " },
      { ...DATOS_GENLOGS[2], valor: "Av. Ejemplo 123" },
    ])
    expect(lista.map((d) => d.id)).toEqual(["correo", "direccion"])
  })
})
