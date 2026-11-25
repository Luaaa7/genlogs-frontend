import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { IngresoClientePage } from "./IngresoClientePage"
import { ingresarCliente } from "../api/ingresoClienteApi"

vi.mock("../api/ingresoClienteApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/ingresoClienteApi")>()
  return { ...original, ingresarCliente: vi.fn() }
})

function renderIngreso(ruta = "/portal/ingreso?volver=%2F") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/portal/ingreso" element={<IngresoClientePage />} />
        <Route path="/" element={<div>Landing</div>} />
        <Route path="/portal/pedidos" element={<div>Mis pedidos</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function llenarYEnviar() {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "compras@minera.pe" } })
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreta123" } })
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }))
}

describe("IngresoClientePage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(ingresarCliente).mockReset()
  })

  it("abre la sesión del cliente y vuelve a ?volver= (D-30)", async () => {
    vi.mocked(ingresarCliente).mockResolvedValue({ token: "tok", nombre: "Minera", nombreRol: "CLIENTE" })
    renderIngreso()
    llenarYEnviar()
    expect(await screen.findByText("Landing")).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBe("tok")
    expect(ingresarCliente).toHaveBeenCalledWith({ correo: "compras@minera.pe", password: "secreta123" })
  })

  it("sin ?volver= va a Mis pedidos", async () => {
    vi.mocked(ingresarCliente).mockResolvedValue({ token: "tok", nombreRol: "CLIENTE" })
    renderIngreso("/portal/ingreso")
    llenarYEnviar()
    expect(await screen.findByText("Mis pedidos")).toBeTruthy()
  })

  it("rechaza una cuenta que no es de cliente", async () => {
    vi.mocked(ingresarCliente).mockResolvedValue({ token: "tok", nombreRol: "JEFE_ADMINISTRATIVO" })
    renderIngreso()
    llenarYEnviar()
    expect(await screen.findByText(/no es del portal de clientes/)).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
  })

  it("muestra el mensaje del backend si la contraseña es incorrecta", async () => {
    vi.mocked(ingresarCliente).mockRejectedValue({ response: { status: 401, data: { message: "Correo o contraseña incorrectos." } } })
    renderIngreso()
    llenarYEnviar()
    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeTruthy()
  })

  it("el título y el resumen van dentro de la misma tarjeta que los campos (v3.4)", () => {
    renderIngreso()
    const tarjeta = screen.getByTestId("tarjeta-ingreso")
    expect(tarjeta.contains(screen.getByRole("heading", { name: "Ingresa a tu cuenta" }))).toBe(true)
    expect(tarjeta.contains(screen.getByLabelText("Correo"))).toBe(true)
    const lista = screen.getByRole("list", { name: "Lo que puedes gestionar en el portal" })
    expect(tarjeta.contains(lista)).toBe(true)
    expect(lista.textContent).toMatch(/Cotizaciones/)
    expect(lista.textContent).toMatch(/Órdenes/)
    expect(lista.textContent).toMatch(/Despachos/)
  })
})

describe("IngresoClientePage: usabilidad", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(ingresarCliente).mockReset()
  })

  it("los campos piden el autocompletado correcto del navegador", () => {
    renderIngreso()
    expect(screen.getByLabelText("Correo").getAttribute("autocomplete")).toBe("email")
    expect(screen.getByLabelText("Contraseña").getAttribute("autocomplete")).toBe("current-password")
  })

  it("el ojito muestra y oculta la contraseña y se alcanza con el teclado", () => {
    renderIngreso()
    const password = screen.getByLabelText("Contraseña") as HTMLInputElement
    const ojo = screen.getByRole("button", { name: "Mostrar contraseña" })
    expect(password.type).toBe("password")
    expect(ojo.getAttribute("tabindex")).toBeNull()
    ojo.focus()
    expect(document.activeElement).toBe(ojo)

    fireEvent.click(ojo)
    expect(password.type).toBe("text")

    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }))
    expect(password.type).toBe("password")
  })

  it("avisa cuando Bloq Mayús está activo y deja de avisar al apagarlo", () => {
    renderIngreso()
    const password = screen.getByLabelText("Contraseña")
    expect(screen.queryByText("Bloq Mayús está activado")).toBeNull()

    fireEvent.keyDown(password, { key: "A", modifierCapsLock: true })
    expect(screen.getByText("Bloq Mayús está activado")).toBeTruthy()

    fireEvent.keyUp(password, { key: "CapsLock", modifierCapsLock: false })
    expect(screen.queryByText("Bloq Mayús está activado")).toBeNull()
  })

  it("«¿Olvidaste tu contraseña?» lleva a la recuperación, junto a la etiqueta de la contraseña", () => {
    renderIngreso()

    const enlace = screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })

    expect(enlace.getAttribute("href")).toBe("/recuperar-password")
    expect(enlace.parentElement?.contains(screen.getByText("Contraseña"))).toBe(true)
  })

  it("ya no pide contactar al administrador: el cliente se recupera solo", () => {
    renderIngreso()
    expect(screen.queryByText(/administrador de tu empresa/)).toBeNull()
    expect(screen.queryByRole("button", { name: "¿Olvidaste tu contraseña?" })).toBeNull()
  })

  it("mientras ingresa muestra «Ingresando...», deshabilita el botón y no envía dos veces", async () => {
    vi.mocked(ingresarCliente).mockReturnValue(new Promise(() => {}))
    renderIngreso()
    llenarYEnviar()

    const boton = (await screen.findByRole("button", { name: "Ingresando..." })) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
    fireEvent.submit(boton.closest("form") as HTMLFormElement)

    expect(ingresarCliente).toHaveBeenCalledTimes(1)
  })

  it("si el ingreso falla, el botón vuelve a quedar disponible", async () => {
    vi.mocked(ingresarCliente).mockRejectedValue({ response: { status: 401, data: { message: "Correo o contraseña incorrectos." } } })
    renderIngreso()
    llenarYEnviar()

    await screen.findByText("Correo o contraseña incorrectos.")
    expect((screen.getByRole("button", { name: "Ingresar" }) as HTMLButtonElement).disabled).toBe(false)
  })
})
