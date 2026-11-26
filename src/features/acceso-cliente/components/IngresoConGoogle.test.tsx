import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { IngresoConGoogle } from "./IngresoConGoogle"
import { ingresarConGoogle } from "../api/ingresoGoogleApi"
import { leerSesionCliente } from "@/lib/sesiones"
import { agregarAlCarrito } from "@/lib/carritoPublico"

vi.mock("../api/ingresoGoogleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/ingresoGoogleApi")>()
  return { ...original, ingresarConGoogle: vi.fn() }
})

// El botón real carga el script de Google; aquí basta un botón que entrega el token.
vi.mock("./BotonGoogle", () => ({
  BotonGoogle: ({ onCredential }: { onCredential: (c: string) => void }) => (
    <button type="button" onClick={() => onCredential("id-token")}>Continuar con Google</button>
  ),
}))

function renderGoogle(ruta = "/portal/ingreso") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/portal/ingreso" element={<IngresoConGoogle />} />
        <Route path="/portal/pedidos" element={<div>Mis pedidos</div>} />
        <Route path="/portal/solicitud" element={<div>Nueva solicitud</div>} />
        <Route path="/portal/empresa" element={<div>Datos de la empresa</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("IngresoConGoogle", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(ingresarConGoogle).mockReset()
  })

  it("explica bajo el botón de Google que los datos de la empresa se piden antes de la primera cotización", () => {
    renderGoogle()
    expect(screen.getByText(/entra rápido con tu cuenta de google/i)).toBeTruthy()
    expect(screen.getByText(/antes de tu primera cotización/i)).toBeTruthy()
  })

  it("cliente con empresa: abre la sesión y vuelve a ?volver=", async () => {
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      token: "tok", nombre: "Titular", nombreRol: "CLIENTE", perfilCompleto: true, pendiente: false,
    })
    renderGoogle("/portal/ingreso?volver=%2Fportal%2Fsolicitud")
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
    expect(ingresarConGoogle).toHaveBeenCalledWith("id-token")
    expect(localStorage.getItem("cliente_access_token")).toBe("tok")
    expect(leerSesionCliente()?.perfilCompleto).toBe(true)
  })

  it("cuenta nueva sin empresa: abre la sesión sin pedir datos todavía (se piden al cotizar)", async () => {
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      token: "tok", nombre: "Gina", nombreRol: "CLIENTE", perfilCompleto: false, pendiente: false,
    })
    renderGoogle()
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText("Mis pedidos")).toBeTruthy()
    expect(leerSesionCliente()?.perfilCompleto).toBe(false)
  })

  it("acceso pendiente: no abre sesión y muestra el aviso", async () => {
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      nombre: "Espera", perfilCompleto: false, pendiente: true, mensaje: "Tu acceso al portal está pendiente.",
    })
    renderGoogle()
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText("Tu acceso al portal está pendiente.")).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
  })

  it("rechazo del backend: muestra su mensaje", async () => {
    vi.mocked(ingresarConGoogle).mockRejectedValue({
      response: { status: 400, data: { message: "Este correo pertenece al personal de GENLOGS." } },
    })
    renderGoogle()
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText("Este correo pertenece al personal de GENLOGS.")).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
  })

  it("con repuestos en el carrito de la landing y sin ?volver=, va a /portal/solicitud", async () => {
    agregarAlCarrito({ id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" })
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      token: "tok", nombre: "Titular", nombreRol: "CLIENTE", perfilCompleto: true, pendiente: false,
    })
    renderGoogle("/portal/ingreso")
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
  })

  it("una cuenta del personal con Google ve el enlace al ingreso del personal (/login)", async () => {
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      token: "tok", nombre: "Jefe", nombreRol: "JEFE_ADMINISTRATIVO", perfilCompleto: true, pendiente: false,
    })
    renderGoogle("/portal/ingreso")
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    await screen.findByText(/no es del portal de clientes/)
    expect(screen.getByRole("link", { name: "Ir al ingreso del personal" }).getAttribute("href")).toBe("/login")
  })

  it("una cuenta del personal con Google ignora el carrito", async () => {
    agregarAlCarrito({ id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" })
    vi.mocked(ingresarConGoogle).mockResolvedValue({
      token: "tok", nombre: "Jefe", nombreRol: "JEFE_ADMINISTRATIVO", perfilCompleto: true, pendiente: false,
    })
    renderGoogle("/portal/ingreso")
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }))

    expect(await screen.findByText(/no es del portal de clientes/)).toBeTruthy()
    expect(screen.queryByText("Nueva solicitud")).toBeNull()
  })
})
