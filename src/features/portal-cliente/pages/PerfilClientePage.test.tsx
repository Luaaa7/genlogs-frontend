import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { completarEmpresa, obtenerCuentaPortal } from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { publicApi } from "@/api/publicApi"
import { leerSesionCliente } from "@/lib/sesiones"
import { PerfilClientePage } from "./PerfilClientePage"

vi.mock("@/features/acceso-cliente/api/ingresoGoogleApi", async (original) => ({
  ...(await original<typeof import("@/features/acceso-cliente/api/ingresoGoogleApi")>()),
  obtenerCuentaPortal: vi.fn(),
  completarEmpresa: vi.fn(),
}))

vi.mock("@/api/publicApi", () => ({ publicApi: { consultarRazonSocial: vi.fn() } }))

const cuenta = { nombre: "Luana Barrientos", correo: "luana@empresa.pe", perfilCompleto: true, empresa: "Minera Los Andes S.A.C." }

function pintar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><PerfilClientePage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("PerfilClientePage (/portal/perfil)", () => {
  beforeEach(() => {
    vi.mocked(obtenerCuentaPortal).mockReset()
    vi.mocked(completarEmpresa).mockReset()
    vi.mocked(publicApi.consultarRazonSocial).mockReset()
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "sinDato" })
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Nombre de sesión", rol: "CLIENTE" }))
  })

  it("tiene el encabezado del portal con el título «Mi perfil»", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
    pintar()
    expect(screen.getByText("Portal del cliente")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeTruthy()
    await screen.findByText("luana@empresa.pe")
  })

  it("muestra nombre, correo y razón social de la cuenta", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
    pintar()

    await screen.findByText("luana@empresa.pe")
    const datos = screen.getByRole("group", { name: "Datos de la cuenta" })
    expect(within(datos).getByText("Nombre").nextElementSibling?.textContent).toBe("Luana Barrientos")
    expect(within(datos).getByText("Correo").nextElementSibling?.textContent).toBe("luana@empresa.pe")
    expect(within(datos).getByText("Razón social").nextElementSibling?.textContent).toBe("Minera Los Andes S.A.C.")
  })

  it("no inventa datos que la cuenta no trae: sin RUC, teléfono ni dirección", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
    pintar()
    await screen.findByText("luana@empresa.pe")
    expect(screen.queryByText("RUC")).toBeNull()
    expect(screen.queryByText("Teléfono")).toBeNull()
    expect(screen.queryByText("Dirección")).toBeNull()
  })

  it("mientras carga muestra un aviso, con el nombre de la sesión ya visible", () => {
    vi.mocked(obtenerCuentaPortal).mockReturnValue(new Promise(() => {}))
    pintar()
    expect(screen.getByText(/cargando perfil/i)).toBeTruthy()
    expect(screen.getByText("Nombre de sesión")).toBeTruthy()
  })

  it("si falla la carga, avisa, deja reintentar y conserva el nombre de la sesión", async () => {
    vi.mocked(obtenerCuentaPortal).mockRejectedValue(new Error("500"))
    pintar()
    expect(await screen.findByText(/no pudimos cargar los datos de tu cuenta/i)).toBeTruthy()
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeTruthy()
    expect(screen.getByText("Nombre de sesión")).toBeTruthy()
  })

  describe("cuenta sin datos de empresa", () => {
    const sinEmpresa = { ...cuenta, perfilCompleto: false, empresa: null }

    function llenar() {
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
      fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera Sol S.A.C." } })
      fireEvent.change(screen.getByLabelText("Nombres de contacto *"), { target: { value: "Gina" } })
      fireEvent.change(screen.getByLabelText("Apellidos de contacto *"), { target: { value: "Paz" } })
    }

    it("muestra una tarjeta ámbar con el aviso y los campos listos, sin salir del perfil", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      pintar()

      const tarjeta = await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      expect(within(tarjeta).getByText(/RUC y Razón Social.*emitir y aprobar tus cotizaciones/i)).toBeTruthy()
      expect(within(tarjeta).getByLabelText("RUC")).toBeTruthy()
      expect(within(tarjeta).getByLabelText("Razón social")).toBeTruthy()
      expect(within(tarjeta).getByLabelText("Nombres de contacto *")).toBeTruthy()
      expect(within(tarjeta).getByLabelText("Apellidos de contacto *")).toBeTruthy()
      expect(within(tarjeta).getByLabelText("Teléfono (opcional)")).toBeTruthy()
      expect(screen.queryByRole("link", { name: "Completar datos de la empresa" })).toBeNull()
      expect(tarjeta.className).toMatch(/amber/)
    })

    it("nombres y apellidos de contacto vienen repartidos desde el nombre de la sesión", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      pintar()
      const tarjeta = await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      expect((within(tarjeta).getByLabelText("Nombres de contacto *") as HTMLInputElement).value).toBe("Nombre")
      expect((within(tarjeta).getByLabelText("Apellidos de contacto *") as HTMLInputElement).value).toBe("de sesión")
    })

    it("no aparece si la cuenta ya tiene empresa", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
      pintar()
      await screen.findByText("luana@empresa.pe")
      expect(screen.queryByRole("region", { name: /completa los datos de tu empresa/i })).toBeNull()
    })

    it("con un RUC inválido avisa y no llama al servidor", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      pintar()
      await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "123" } })
      fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "X" } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))
      expect(await screen.findByText(/el ruc debe tener 11 dígitos/i)).toBeTruthy()
      expect(completarEmpresa).not.toHaveBeenCalled()
    })

    it("guarda con el endpoint real, marca el perfil completo y vuelve a leer la cuenta", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValueOnce(sinEmpresa)
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
      vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "ok" })
      pintar()
      await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      llenar()
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))

      await waitFor(() => expect(completarEmpresa).toHaveBeenCalledWith({ ruc: "20123456789", razonSocial: "Minera Sol S.A.C.", nombreContacto: "Gina Paz", telefono: "" }))
      await waitFor(() => expect(screen.queryByRole("region", { name: /completa los datos de tu empresa/i })).toBeNull())
      expect(screen.getByText("Razón social")).toBeTruthy()
      expect(leerSesionCliente()?.perfilCompleto).toBe(true)
    })

    it("con Persona natural (DNI) oculta la razón social y guarda con tipoDocumento DNI", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValueOnce(sinEmpresa)
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
      vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "ok" })
      pintar()
      const tarjeta = await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      fireEvent.click(within(tarjeta).getByLabelText("Persona natural (DNI)"))

      expect(within(tarjeta).queryByLabelText("Razón social")).toBeNull()
      expect(within(tarjeta).getByText("Para compras con DNI emitimos boleta de venta y no se requiere orden de compra.")).toBeTruthy()
      fireEvent.change(within(tarjeta).getByLabelText("DNI"), { target: { value: "12345678" } })
      expect(within(tarjeta).queryByLabelText("Nombres de contacto *")).toBeNull()
      fireEvent.change(within(tarjeta).getByLabelText("Nombres *"), { target: { value: "Rosa" } })
      fireEvent.change(within(tarjeta).getByLabelText("Apellidos *"), { target: { value: "Quispe" } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))

      await waitFor(() => expect(completarEmpresa).toHaveBeenCalledWith({ tipoDocumento: "DNI", ruc: "12345678", nombreContacto: "Rosa Quispe", telefono: "" }))
      expect(leerSesionCliente()?.perfilCompleto).toBe(true)
    })

    it("con DNI de menos de 8 dígitos avisa y no llama al servidor", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      pintar()
      const tarjeta = await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      fireEvent.click(within(tarjeta).getByLabelText("Persona natural (DNI)"))
      fireEvent.change(within(tarjeta).getByLabelText("DNI"), { target: { value: "123" } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))

      expect(screen.getByText("El DNI debe tener 8 dígitos.")).toBeTruthy()
      expect(completarEmpresa).not.toHaveBeenCalled()
    })

    it("si la empresa ya es cliente: cierra la sesión y muestra el mensaje de acceso pendiente", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: true, mensaje: "Tu acceso está pendiente de aprobación." })
      pintar()
      await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      llenar()
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))

      expect(await screen.findByText("Tu acceso está pendiente de aprobación.")).toBeTruthy()
      expect(leerSesionCliente()).toBeNull()
    })

    it("si falla el guardado, muestra el error y deja corregir", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue(sinEmpresa)
      vi.mocked(completarEmpresa).mockRejectedValue({ response: { status: 500, data: {} } })
      pintar()
      await screen.findByRole("region", { name: /completa los datos de tu empresa/i })
      llenar()
      fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }))
      expect(await screen.findByText(/no pudimos guardar los datos de tu empresa/i)).toBeTruthy()
      expect(screen.getByRole("button", { name: "Guardar datos" })).toBeTruthy()
    })
  })

  it("ofrece el enlace para cambiar o recuperar la contraseña", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
    pintar()
    const enlace = await screen.findByRole("link", { name: "Cambiar o recuperar contraseña" })
    expect(enlace.getAttribute("href")).toBe("/recuperar-password")
  })
})
