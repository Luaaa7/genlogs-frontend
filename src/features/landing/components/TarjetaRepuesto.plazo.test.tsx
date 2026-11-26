import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { RepuestoPublico } from "@/api/publicApi"
import { TarjetaRepuesto } from "./TarjetaRepuesto"

const base: RepuestoPublico = {
  idProducto: 2, nombre: "Rodamiento 6205", descripcion: null, marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5,
  categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: null,
}

function pintar(repuesto: RepuestoPublico) {
  return render(
    <TarjetaRepuesto repuesto={repuesto} enCotizacion={0} onAgregar={vi.fn()} onSumar={vi.fn()} onRestar={vi.fn()} />,
  )
}

describe("TarjetaRepuesto: plazo", () => {
  it("con el texto fijo «24 a 48 horas» muestra «Plazo según cotización»", () => {
    pintar(base)
    expect(screen.getByText("Plazo según cotización")).toBeTruthy()
    expect(screen.queryByText(/24 a 48/)).toBeNull()
    expect(screen.getByText("Disponible a pedido · sujeto a confirmación")).toBeTruthy()
  })

  it("sin plazo desde la API muestra «Plazo según cotización»", () => {
    pintar({ ...base, plazoEntrega: "" })
    expect(screen.getByText("Plazo según cotización")).toBeTruthy()
    expect(screen.getByText("Disponible a pedido · sujeto a confirmación")).toBeTruthy()
  })

  it("si el producto trae un plazo propio, lo muestra", () => {
    pintar({ ...base, plazoEntrega: "5 a 7 días hábiles" })
    expect(screen.getByText("5 a 7 días hábiles")).toBeTruthy()
    expect(screen.queryByText("Plazo según cotización")).toBeNull()
    expect(screen.getByText("Disponible a pedido · sujeto a confirmación")).toBeTruthy()
  })
})