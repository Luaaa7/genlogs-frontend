import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BotonCargando } from "./BotonCargando"

describe("BotonCargando", () => {
  it("en reposo muestra su etiqueta, sin spinner y habilitado", () => {
    render(<BotonCargando cargando={false} textoCargando="Procesando...">Aprobar</BotonCargando>)
    const boton = screen.getByRole("button", { name: "Aprobar" })
    expect(boton.hasAttribute("disabled")).toBe(false)
    expect(boton.querySelector("svg")).toBeNull()
    expect(boton.getAttribute("aria-busy")).not.toBe("true")
  })

  it("cargando: se deshabilita, cambia la etiqueta y pone un spinner a la izquierda", () => {
    const alHacerClic = vi.fn()
    render(<BotonCargando cargando textoCargando="Procesando..." onClick={alHacerClic}>Aprobar</BotonCargando>)
    const boton = screen.getByRole("button", { name: "Procesando..." })
    expect(boton.hasAttribute("disabled")).toBe(true)
    expect(boton.getAttribute("aria-busy")).toBe("true")
    const spinner = boton.firstElementChild as SVGElement
    expect(spinner.tagName.toLowerCase()).toBe("svg")
    expect(spinner.getAttribute("aria-hidden")).toBe("true")
    expect(spinner.getAttribute("class")).toContain("animate-spin")
    expect(spinner.getAttribute("class")).toContain("motion-reduce:animate-none")
    fireEvent.click(boton)
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it("respeta un disabled propio aunque no esté cargando", () => {
    render(<BotonCargando cargando={false} textoCargando="Enviando..." disabled>Enviar</BotonCargando>)
    expect(screen.getByRole("button", { name: "Enviar" }).hasAttribute("disabled")).toBe(true)
  })

  it("con un icono propio, lo cambia por el spinner mientras carga", () => {
    const { rerender } = render(
      <BotonCargando cargando={false} textoCargando="Buscando..." icono={<span data-testid="icono" />}>Buscar</BotonCargando>,
    )
    expect(screen.getByTestId("icono")).toBeTruthy()
    rerender(<BotonCargando cargando textoCargando="Buscando..." icono={<span data-testid="icono" />}>Buscar</BotonCargando>)
    expect(screen.queryByTestId("icono")).toBeNull()
  })
})
