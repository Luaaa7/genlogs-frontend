import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { RepuestoPublico } from "@/api/publicApi"
import { TarjetaRepuesto } from "./TarjetaRepuesto"

const base: RepuestoPublico = {
  idProducto: 2, nombre: "Rodamiento 6205", descripcion: null, marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5,
  categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: "https://res.cloudinary.com/x/6205.jpg",
}

const acciones = () => ({ onAgregar: vi.fn(), onSumar: vi.fn(), onRestar: vi.fn() })

function pintar(repuesto: RepuestoPublico, enCotizacion = 0, a = acciones()) {
  return render(<TarjetaRepuesto repuesto={repuesto} enCotizacion={enCotizacion} {...a} />)
}

describe("TarjetaRepuesto (IC9, IC10)", () => {
  it("con foto verificada muestra la foto real", () => {
    pintar(base)
    expect(screen.getByRole("img", { name: "Rodamiento 6205" })).toBeTruthy()
    expect(screen.queryByText(/foto referencial próximamente/i)).toBeNull()
  })

  it("si la foto falla al cargar, muestra la ilustración de su categoría (IC10)", () => {
    pintar(base)
    fireEvent.error(screen.getByRole("img", { name: "Rodamiento 6205" }))
    expect(screen.queryByRole("img", { name: "Rodamiento 6205" })).toBeNull()
    expect(screen.getByText(/foto referencial próximamente/i)).toBeTruthy()
  })

  it("si el repuesto cambia a otra foto, la vuelve a intentar", () => {
    const { rerender } = pintar(base)
    fireEvent.error(screen.getByRole("img", { name: "Rodamiento 6205" }))
    rerender(
      <TarjetaRepuesto
        repuesto={{ ...base, urlImagen: "https://res.cloudinary.com/x/6205-nueva.jpg" }}
        enCotizacion={0}
        {...acciones()}
      />,
    )
    expect(screen.getByRole("img", { name: "Rodamiento 6205" })).toBeTruthy()
  })

  it("sin foto muestra la ilustración", () => {
    pintar({ ...base, urlImagen: null })
    expect(screen.queryByRole("img", { name: "Rodamiento 6205" })).toBeNull()
    expect(screen.getByText(/foto referencial próximamente/i)).toBeTruthy()
  })

  describe("plazo", () => {
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

  describe("carrito de cotización", () => {
    it("sin agregar muestra «Cotizar», que agrega el repuesto", () => {
      const a = acciones()
      pintar(base, 0, a)

      fireEvent.click(screen.getByRole("button", { name: "Cotizar Rodamiento 6205" }))

      expect(a.onAgregar).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/en cotización/i)).toBeNull()
    })

    it("ya agregado muestra «En cotización (N)» con controles - y +", () => {
      const a = acciones()
      pintar(base, 3, a)

      expect(screen.getByText("En cotización (3)")).toBeTruthy()
      expect(screen.queryByRole("button", { name: "Cotizar Rodamiento 6205" })).toBeNull()

      fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad de Rodamiento 6205" }))
      fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad de Rodamiento 6205" }))
      expect(a.onSumar).toHaveBeenCalledTimes(1)
      expect(a.onRestar).toHaveBeenCalledTimes(1)
    })

    it("el estado se anuncia a lectores de pantalla", () => {
      pintar(base, 2)
      expect(screen.getByRole("status").textContent).toContain("En cotización (2)")
    })
  })
})