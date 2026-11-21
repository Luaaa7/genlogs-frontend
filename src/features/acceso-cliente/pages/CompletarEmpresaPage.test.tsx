import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { CompletarEmpresaPage } from "./CompletarEmpresaPage"
import { completarEmpresa } from "../api/ingresoGoogleApi"
import { iniciarSesionCliente, leerSesionCliente } from "@/lib/sesiones"

vi.mock("../api/ingresoGoogleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/ingresoGoogleApi")>()
  return { ...original, completarEmpresa: vi.fn() }
})

function renderPagina(ruta = "/portal/empresa?volver=%2Fportal%2Fsolicitud") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/portal/empresa" element={<CompletarEmpresaPage />} />
        <Route path="/portal/solicitud" element={<div>Nueva solicitud</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function llenar(ruc = "20123456789") {
  fireEvent.change(screen.getByLabelText("RUC"), { target: { value: ruc } })
  fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera Sol S.A.C." } })
  fireEvent.change(screen.getByLabelText("Persona de contacto"), { target: { value: "Gina Paz" } })
  fireEvent.change(screen.getByLabelText("Teléfono (opcional)"), { target: { value: "999111222" } })
}

describe("CompletarEmpresaPage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(completarEmpresa).mockReset()
    iniciarSesionCliente("tok", "Gina", false)
  })

  it("explica por qué se piden los datos", () => {
    renderPagina()
    expect(screen.getByRole("heading", { name: "Datos de tu empresa" })).toBeTruthy()
    expect(screen.getByText(/antes de tu primera cotización/i)).toBeTruthy()
  })

  it("empresa nueva: guarda los datos y sigue a la solicitud", async () => {
    vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "Listo" })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
    expect(completarEmpresa).toHaveBeenCalledWith({
      ruc: "20123456789", razonSocial: "Minera Sol S.A.C.", nombreContacto: "Gina Paz", telefono: "999111222",
    })
    expect(leerSesionCliente()).toEqual({ nombre: "Gina Paz", rol: "CLIENTE", perfilCompleto: true })
  })

  it("empresa que ya es cliente: cierra la sesión y avisa que el acceso está pendiente", async () => {
    vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: true, mensaje: "Tu acceso quedó pendiente." })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("Tu acceso quedó pendiente.")).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
    expect(screen.queryByRole("button", { name: "Guardar y continuar" })).toBeNull()
  })

  it("RUC que no es de 11 dígitos con 10 o 20: avisa sin llamar al servidor", () => {
    renderPagina()
    llenar("12345678")
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(screen.getByText(/11 dígitos/)).toBeTruthy()
    expect(completarEmpresa).not.toHaveBeenCalled()
  })

  it("error del servidor: muestra su mensaje y deja reintentar", async () => {
    vi.mocked(completarEmpresa).mockRejectedValue({
      response: { status: 400, data: { message: "No pudimos validar tu RUC en SUNAT." } },
    })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("No pudimos validar tu RUC en SUNAT.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toBeTruthy()
  })
})
