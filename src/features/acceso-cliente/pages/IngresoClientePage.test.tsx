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
})
