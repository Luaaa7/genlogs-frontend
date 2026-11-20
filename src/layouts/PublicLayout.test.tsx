import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { PublicLayout } from "./PublicLayout"

vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

describe("Barra de la landing", () => {
  it("«Ingresar» lleva al ingreso del cliente, no al registro (PS4)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
  })
})