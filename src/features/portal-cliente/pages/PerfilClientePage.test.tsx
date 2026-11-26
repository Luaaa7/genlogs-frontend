import { render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { obtenerCuentaPortal } from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { PerfilClientePage } from "./PerfilClientePage"

vi.mock("@/features/acceso-cliente/api/ingresoGoogleApi", async (original) => ({
  ...(await original<typeof import("@/features/acceso-cliente/api/ingresoGoogleApi")>()),
  obtenerCuentaPortal: vi.fn(),
}))

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

  it("una cuenta sin empresa lo dice y enlaza a completar los datos, volviendo al perfil", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue({ ...cuenta, perfilCompleto: false, empresa: null })
    pintar()

    const enlace = await screen.findByRole("link", { name: "Completar datos de la empresa" })
    expect(enlace.getAttribute("href")).toBe("/portal/empresa?volver=%2Fportal%2Fperfil")
    expect(screen.queryByText("Razón social")).toBeNull()
  })

  it("ofrece el enlace para cambiar o recuperar la contraseña", async () => {
    vi.mocked(obtenerCuentaPortal).mockResolvedValue(cuenta)
    pintar()
    const enlace = await screen.findByRole("link", { name: "Cambiar o recuperar contraseña" })
    expect(enlace.getAttribute("href")).toBe("/recuperar-password")
  })
})
