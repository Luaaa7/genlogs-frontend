import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Portada } from "./Portada"

function pintar() {
  render(
    <MemoryRouter>
      <Routes><Route element={<PublicLayout />}><Route index element={<Portada />} /></Route></Routes>
    </MemoryRouter>,
  )
}

describe("Portada", () => {
  it("el botón que va a /portal/registro dice «Crear cuenta»", () => {
    pintar()
    const botones = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/portal/registro")
    expect(botones).toHaveLength(1)
    expect(botones[0].textContent).toBe("Crear cuenta")
  })

  it("el único «Ingresar» va a /portal/ingreso", () => {
    pintar()
    const ingresar = screen.getAllByRole("link", { name: "Ingresar" })
    expect(ingresar).toHaveLength(1)
    expect(ingresar[0].getAttribute("href")).toBe("/portal/ingreso")
  })
})
