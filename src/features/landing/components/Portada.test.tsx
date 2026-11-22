import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { Portada } from "./Portada"
import { CIFRAS, cifrasConValor, type Cifra } from "../lib/cifras"

const cifra = (id: string, valor: string | null, etiqueta: string): Cifra => ({
  id, valor, etiqueta, fuente: "Supabase (Ale)", fecha: "21/11/2026",
})

function pintar(cifras?: Cifra[]) {
  return render(<MemoryRouter><Portada cifras={cifras} /></MemoryRouter>)
}

describe("Portada (v3.4, K1)", () => {
  it("«Ingresar» va al ingreso del portal y «Solicitar cotización» a la Solicitud rápida", () => {
    pintar()
    expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.getByRole("link", { name: /Solicitar cotización/ }).getAttribute("href")).toBe("#solicitud")
  })

  it("solo muestra las cifras que tienen valor, con su fecha", () => {
    pintar([cifra("repuestos", "120", "repuestos en catálogo"), cifra("clientes", null, "empresas cliente")])
    expect(screen.getByText("120")).toBeTruthy()
    expect(screen.getByText("repuestos en catálogo")).toBeTruthy()
    expect(screen.queryByText("empresas cliente")).toBeNull()
    expect(screen.getByText("Cifras al 21/11/2026.")).toBeTruthy()
  })

  it("sin ninguna cifra comprobada no muestra la fila de cifras", () => {
    pintar([cifra("repuestos", null, "repuestos en catálogo"), cifra("clientes", "  ", "empresas cliente")])
    expect(screen.queryByText(/Cifras al/)).toBeNull()
  })

  it("ya no muestra las cifras sin dato «360°» y «24/7»", () => {
    pintar()
    expect(screen.queryByText("360°")).toBeNull()
    expect(screen.queryByText("24/7")).toBeNull()
  })

  it("todas las cifras guardan su fuente y su fecha", () => {
    for (const c of CIFRAS) {
      expect(c.fuente).not.toBe("")
      expect(c.fecha).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    }
    expect(cifrasConValor(CIFRAS).every((c) => c.valor !== null)).toBe(true)
  })
})
