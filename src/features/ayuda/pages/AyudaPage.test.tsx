import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { useAuthStore } from "@/features/auth/store/authStore"
import { AyudaPage } from "./AyudaPage"

function abrirSesionInterna() {
  localStorage.setItem("access_token", "token")
  useAuthStore.setState({ token: "token" })
}

function abrirSesionCliente() {
  localStorage.setItem("cliente_access_token", "token")
  sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Cliente", rol: "CLIENTE" }))
}

function verAyuda() {
  return render(<MemoryRouter><AyudaPage /></MemoryRouter>)
}

describe("Ayuda (v3.4, K2)", () => {
  // Primero se vacía el estado (el store guarda copia en sessionStorage) y luego el almacenamiento.
  function limpiar() {
    useAuthStore.setState({ token: null })
    localStorage.clear()
    sessionStorage.clear()
  }
  beforeEach(limpiar)
  afterEach(limpiar)

  it("el visitante ve solo la guía de clientes, sin pestañas ni guía del personal", () => {
    verAyuda()
    expect(screen.getByRole("heading", { name: /Para clientes/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ingresar al portal" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.queryByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(screen.queryByRole("link", { name: "Acceso del personal" })).toBeNull()
    expect(screen.queryByText(/Órdenes de compra/)).toBeNull()
  })

  it("el cliente con sesión del portal tampoco ve la guía del personal", () => {
    abrirSesionCliente()
    verAyuda()
    expect(screen.getByRole("heading", { name: /Para clientes/ })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeNull()
    expect(screen.queryByRole("tablist")).toBeNull()
  })

  it("restos de una sesión del personal sin token en memoria no muestran la guía interna", () => {
    localStorage.setItem("access_token", "token")
    verAyuda()
    expect(screen.queryByRole("tablist")).toBeNull()
    expect(screen.queryByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeNull()
  })

  it("el personal con sesión ve dos pestañas y abre primero la suya", () => {
    abrirSesionInterna()
    verAyuda()
    expect(screen.getByRole("tablist")).toBeTruthy()
    expect(screen.getByRole("tab", { name: "Para el personal de GENLOGS" }).getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Acceso del personal" }).getAttribute("href")).toBe("/login")
    expect(screen.queryByRole("heading", { name: /Para clientes/ })).toBeNull()
  })

  it("el personal cambia a la guía de clientes con la pestaña y con las flechas", () => {
    abrirSesionInterna()
    verAyuda()
    fireEvent.click(screen.getByRole("tab", { name: "Para clientes" }))
    expect(screen.getByRole("heading", { name: /Para clientes/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ingresar al portal" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.queryByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeNull()

    fireEvent.keyDown(screen.getByRole("tab", { name: "Para clientes" }), { key: "ArrowRight" })
    expect(screen.getByRole("tab", { name: "Para el personal de GENLOGS" }).getAttribute("aria-selected")).toBe("true")
  })

  it("muestra las preguntas frecuentes y el enlace a Contacto", () => {
    verAyuda()
    expect(screen.getByRole("heading", { name: "Preguntas frecuentes" })).toBeTruthy()
    expect(screen.getByText("¿Cuánto tiempo vale una cotización?")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
  })
})
