import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EtapasDespacho } from "./EtapasDespacho"

describe("EtapasDespacho", () => {
  it("dice a los lectores de pantalla en qué etapa va, sin crear listas", () => {
    const { container } = render(<EtapasDespacho etapa="EN_TRANSITO" />)
    expect(screen.getByText("Etapa 3 de 4: En tránsito")).toBeTruthy()
    expect(container.querySelector("li, ul, ol")).toBeNull()
  })
  it("una etapa desconocida no dibuja la línea", () => {
    const { container } = render(<EtapasDespacho etapa="EN_RUTA" />)
    expect(container.firstChild).toBeNull()
  })
})
