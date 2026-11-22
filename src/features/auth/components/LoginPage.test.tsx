import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { LoginPage } from "./LoginPage"

describe("LoginPage (v3.4, K3)", () => {
  it("lleva al cliente a su portal", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Ingresa al portal" }).getAttribute("href")).toBe("/portal/ingreso")
  })
})
