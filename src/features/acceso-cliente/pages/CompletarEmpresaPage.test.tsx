import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { CompletarEmpresaPage } from "./CompletarEmpresaPage"
import { completarEmpresa } from "../api/ingresoGoogleApi"
import { iniciarSesionCliente, leerSesionCliente } from "@/lib/sesiones"
import { publicApi } from "@/api/publicApi"

vi.mock("../api/ingresoGoogleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/ingresoGoogleApi")>()
  return { ...original, completarEmpresa: vi.fn() }
})

vi.mock("@/api/publicApi", () => ({ publicApi: { consultarRazonSocial: vi.fn() } }))

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
    vi.mocked(publicApi.consultarRazonSocial).mockReset()
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "sinDato" })
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

  it("con un RUC válido completa la razón social con SUNAT y sigue editable", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "MINERA SOL S.A.C." })
    renderPagina()
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })

    await vi.waitFor(() => expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("MINERA SOL S.A.C."))
    expect(publicApi.consultarRazonSocial).toHaveBeenCalledWith("20123456789", expect.anything())
    expect(screen.getByText(/completada con SUNAT/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera Sol" } })
    expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("Minera Sol")
  })

  it("no pisa la razón social escrita a mano ni consulta un RUC incompleto", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "DE SUNAT" })
    renderPagina()
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Escrita a mano" } })
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "2012345" } })
    expect(publicApi.consultarRazonSocial).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    await vi.waitFor(() => expect(publicApi.consultarRazonSocial).toHaveBeenCalled())
    expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("Escrita a mano")
  })

  it("muestra en qué paso va: la cuenta ya está hecha y ahora toca la empresa", () => {
    renderPagina()
    const pasos = screen.getByRole("list", { name: "Pasos para tu primera cotización" })
    const items = within(pasos).getAllByRole("listitem")
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining("Tu cuenta"),
      expect.stringContaining("Tu empresa"),
      expect.stringContaining("Tu solicitud"),
    ])
    expect(items[0].textContent).toContain("Listo")
    expect(items[1].getAttribute("aria-current")).toBe("step")
  })

  it("el resumen de la empresa espera el RUC y luego muestra lo que trajo SUNAT", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "MINERA SOL S.A.C." })
    renderPagina()
    const resumen = screen.getByRole("complementary", { name: "Resumen de tu empresa" })
    expect(within(resumen).getByText("Escribe tu RUC")).toBeTruthy()

    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    expect(screen.getByText("Buscando…")).toBeTruthy()

    expect(await screen.findByText("Encontrado en SUNAT")).toBeTruthy()
    expect(within(resumen).getByText("MINERA SOL S.A.C.")).toBeTruthy()
    expect(within(resumen).getByText("RUC 20123456789")).toBeTruthy()
  })

  it("si SUNAT no responde, avisa que la escriba a mano sin marcar el RUC como encontrado", async () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    expect(await screen.findByText(/escríbela a mano/)).toBeTruthy()
    expect(screen.queryByText("Encontrado en SUNAT")).toBeNull()
    expect(screen.queryByText("Buscando…")).toBeNull()
  })

  it("si guardar tarda (servidor activándose), avisa que espere sin cerrar la página", () => {
    vi.mocked(completarEmpresa).mockReturnValue(new Promise(() => {}))
    renderPagina()
    llenar()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))
      expect(screen.queryByText("Esto está tardando más de lo normal")).toBeNull()
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.getByText("Esto está tardando más de lo normal")).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
