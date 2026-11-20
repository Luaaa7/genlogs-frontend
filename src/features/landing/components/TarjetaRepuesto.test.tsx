import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { RepuestoPublico } from "@/api/publicApi"
import { TarjetaRepuesto } from "./TarjetaRepuesto"

const base: RepuestoPublico = {
  idProducto: 2, nombre: "Rodamiento 6205", descripcion: null, marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5,
  categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: "https://res.cloudinary.com/x/6205.jpg",
}

function pintar(repuesto: RepuestoPublico) {
  return render(<TarjetaRepuesto repuesto={repuesto} cotizando={false} cotizado={false} onCotizar={vi.fn()} />)
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
        cotizando={false}
        cotizado={false}
        onCotizar={vi.fn()}
      />,
    )
    expect(screen.getByRole("img", { name: "Rodamiento 6205" })).toBeTruthy()
  })

  it("sin foto muestra la ilustración", () => {
    pintar({ ...base, urlImagen: null })
    expect(screen.queryByRole("img", { name: "Rodamiento 6205" })).toBeNull()
    expect(screen.getByText(/foto referencial próximamente/i)).toBeTruthy()
  })
})