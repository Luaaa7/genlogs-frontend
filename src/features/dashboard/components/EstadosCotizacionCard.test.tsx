import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import type { CotizacionEstadoItem } from "@/types/dashboard.types"
import { EstadosCotizacionCard } from "./EstadosCotizacionCard"

function pintar(estados: CotizacionEstadoItem[]) {
  return render(
    <MemoryRouter>
      <EstadosCotizacionCard estados={estados} />
    </MemoryRouter>,
  )
}

const fila = (estado: string, cantidad: number): CotizacionEstadoItem => ({ estado, cantidad, porcentaje: 0 })

describe("EstadosCotizacionCard", () => {
  it("cada estado lleva su color y su porcentaje del total", () => {
    const { container } = pintar([fila("APROBADA", 3), fila("RECHAZADA", 1), fila("ENVIADA", 4), fila("BORRADOR", 2)])
    const tonos = Array.from(container.querySelectorAll("li")).map((li) => li.getAttribute("data-tono"))
    // Ordenado de mayor a menor: Enviada 4, Aprobada 3, Borrador 2, Rechazada 1
    expect(tonos).toEqual(["cliente", "exito", "neutro", "cerrada"])
    expect(screen.getByText("40%")).toBeTruthy()
    expect(screen.getByText("10%")).toBeTruthy()
  })

  it("los estados de la aprobación interna se ven con su nombre, no con el código", () => {
    pintar([fila("APROBADA_INTERNA", 1), fila("PENDIENTE_APROBACION", 2)])
    expect(screen.getByText("Aprobada por el Jefe")).toBeTruthy()
    expect(screen.getByText("Pendiente de aprobación")).toBeTruthy()
    expect(screen.queryByText("APROBADA_INTERNA")).toBeNull()
  })

  it("un estado desconocido se muestra tal cual, sin romper la tarjeta", () => {
    const { container } = pintar([fila("OTRO_ESTADO", 1)])
    expect(screen.getByText("OTRO_ESTADO")).toBeTruthy()
    expect(container.querySelector("li")?.getAttribute("data-tono")).toBe("interno")
  })

  it("sin cotizaciones muestra el mensaje y el enlace para crear la primera", () => {
    pintar([fila("BORRADOR", 0)])
    expect(screen.getByText("Sin cotizaciones registradas.")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Crear la primera cotización" }).getAttribute("href")).toBe("/cotizaciones/nueva")
  })
})