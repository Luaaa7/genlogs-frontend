import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { SelectorMarca } from "./SelectorMarca"

const MARCAS = ["ABB", "Siemens", "Schneider Electric", "Yokogawa"]

function pintar(valor?: string) {
  const onChange = vi.fn()
  render(
    <div>
      <span id="etq-marca">Marca</span>
      <SelectorMarca marcas={MARCAS} valor={valor} onChange={onChange} etiquetaId="etq-marca" />
    </div>,
  )
  return onChange
}

const abrir = () => fireEvent.click(screen.getByRole("button"))

describe("SelectorMarca", () => {
  it("sin marca elegida muestra «Todas las marcas» y al abrir lista todas", () => {
    pintar()
    expect(screen.getByRole("button").textContent).toContain("Todas las marcas")
    expect(screen.queryByRole("listbox")).toBeNull()
    abrir()
    expect(screen.getAllByRole("option").length).toBe(MARCAS.length + 1)
  })

  it("el buscador filtra sin importar mayúsculas", () => {
    pintar()
    abrir()
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "sie" } })
    expect(screen.getByRole("option", { name: "Siemens" })).toBeTruthy()
    expect(screen.queryByRole("option", { name: "ABB" })).toBeNull()
  })

  it("al elegir una marca avisa cuál y se cierra", () => {
    const onChange = pintar()
    abrir()
    fireEvent.click(screen.getByRole("option", { name: "Siemens" }))
    expect(onChange).toHaveBeenCalledWith("Siemens")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("«Todas las marcas» quita el filtro", () => {
    const onChange = pintar("ABB")
    expect(screen.getByRole("button").textContent).toContain("ABB")
    abrir()
    fireEvent.click(screen.getByRole("option", { name: "Todas las marcas" }))
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it("con el teclado: flecha abajo y Enter elige la primera marca", () => {
    const onChange = pintar()
    abrir()
    const buscador = screen.getByRole("combobox")
    fireEvent.keyDown(buscador, { key: "ArrowDown" })
    fireEvent.keyDown(buscador, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("ABB")
  })

  it("Escape cierra la lista sin cambiar la marca", () => {
    const onChange = pintar()
    abrir()
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("si nada coincide lo dice", () => {
    pintar()
    abrir()
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } })
    expect(screen.getByText("No hay marcas con «zzz».")).toBeTruthy()
  })
})