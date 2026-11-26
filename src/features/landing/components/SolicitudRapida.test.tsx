import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const enviar = vi.hoisted(() => vi.fn())
vi.mock("../lib/enviarSolicitudLanding", () => ({ enviarSolicitudLanding: enviar }))

import { SolicitudRapida } from "./SolicitudRapida"
import { guardarPedidoPendiente, leerPedidoPendiente } from "../lib/pedidoPendiente"

function SolicitudPortal() {
  const { pathname, search } = useLocation()
  return <p>portal{pathname}{search}</p>
}

const ENLACE_MAS = "+ Agregar marca o N.° de parte (opcional)"
const abrirMas = () => fireEvent.click(screen.getByRole("button", { name: ENLACE_MAS }))

function pintar() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SolicitudRapida />} />
        <Route path="/portal/solicitud" element={<SolicitudPortal />} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>,
  )
}

function llenar() {
  abrirMas()
  fireEvent.change(screen.getByLabelText(/^marca/i), { target: { value: "Caterpillar" } })
  fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
  fireEvent.change(screen.getByLabelText(/qué repuesto necesitas/i), { target: { value: "Filtro de combustible" } })
  fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: "2" } })
}

describe("SolicitudRapida (D-16, D-30)", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("los textos de la izquierda hablan de ingresar con Google o correo, sin pedir el RUC de entrada", () => {
    pintar()
    expect(screen.getByRole("heading", { name: "Cuéntanos qué necesitas." })).toBeTruthy()
    expect(screen.getByText(/ingresas con Google o con tu correo/i)).toBeTruthy()
    const pasos = screen.getByRole("list")
    expect(pasos.textContent).toContain("Ingresa con Google o con tu correo")
    expect(pasos.textContent).toContain("Adjunta una foto o PDF")
    expect(document.body.textContent).not.toMatch(/crear tu acceso con el RUC|Crea tu acceso con el RUC/)
  })

  it("deja a la vista el repuesto y la cantidad, y pliega marca y N.º de parte bajo un enlace", () => {
    pintar()
    expect(screen.getByLabelText(/qué repuesto necesitas/i)).toBeTruthy()
    expect(screen.getByLabelText(/cantidad/i)).toBeTruthy()
    // Los dos campos que quedan a la vista son obligatorios (asterisco).
    expect(screen.getAllByText("(obligatorio)")).toHaveLength(2)
    expect(screen.queryByLabelText(/^marca/i)).toBeNull()
    expect(screen.queryByLabelText(/n\.º de parte/i)).toBeNull()

    abrirMas()
    expect(screen.getByLabelText(/^marca/i)).toBeTruthy()
    expect(screen.getByLabelText(/n\.º de parte/i)).toBeTruthy()
    expect(screen.queryByRole("button", { name: ENLACE_MAS })).toBeNull()
  })

  it("avisa que la foto de la placa o el PDF se adjuntan en el siguiente paso", () => {
    pintar()
    expect(
      screen.getByText("¿Tienes una foto de la placa o un listado en PDF? Podrás adjuntarlo en el siguiente paso al ingresar."),
    ).toBeTruthy()
  })

  it("un pedido guardado con marca y N.º de parte deja esos campos abiertos", () => {
    guardarPedidoPendiente({ marca: "SKF", numeroParte: "6205", descripcion: "Rodamiento", cantidad: 4 })
    pintar()
    expect((screen.getByLabelText(/^marca/i) as HTMLInputElement).value).toBe("SKF")
    expect(screen.queryByRole("button", { name: ENLACE_MAS })).toBeNull()
  })

  it("valida antes de enviar: descripción y marca si hay N.º de parte", async () => {
    pintar()
    abrirMas()
    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))
    expect(await screen.findByText(/cuéntanos qué repuesto necesitas/i)).toBeTruthy()
    expect(screen.getByText(/indica la marca del n\.º de parte/i)).toBeTruthy()
    expect(enviar).not.toHaveBeenCalled()
  })

  it("sin cuenta guarda el pedido y manda a la nueva solicitud del portal (que pide el ingreso)", async () => {
    pintar()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

    expect(await screen.findByText("portal/portal/solicitud")).toBeTruthy()
    expect(leerPedidoPendiente()).toMatchObject({
      marca: "Caterpillar", numeroParte: "1R-0750", descripcion: "Filtro de combustible", cantidad: 2,
    })
    expect(enviar).not.toHaveBeenCalled()
  })

  it("sin cuenta y sin marca ni N.º de parte también guarda el pedido con solo repuesto y cantidad", async () => {
    pintar()
    fireEvent.change(screen.getByLabelText(/qué repuesto necesitas/i), { target: { value: "Faja de ventilador" } })
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

    expect(await screen.findByText("portal/portal/solicitud")).toBeTruthy()
    expect(leerPedidoPendiente()).toMatchObject({ marca: "", numeroParte: "", descripcion: "Faja de ventilador", cantidad: 1 })
  })

  it("con sesión de cliente envía directo y muestra el código", async () => {
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockResolvedValue({ idSolicitud: 7, codigoSolicitud: "SOL-7", estado: "PENDIENTE" })
    pintar()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

    expect(await screen.findByText(/recibimos tu pedido sol-7/i)).toBeTruthy()
    expect(enviar).toHaveBeenCalledWith(
      { marca: "Caterpillar", numeroParte: "1R-0750", descripcion: "Filtro de combustible", cantidad: 2 },
      "tok",
    )
  })

  it("al volver del registro envía solo el pedido guardado y lo borra", async () => {
    guardarPedidoPendiente({ marca: "SKF", numeroParte: "6205", descripcion: "Rodamiento", cantidad: 4 })
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockResolvedValue({ idSolicitud: 8, codigoSolicitud: "SOL-8", estado: "PENDIENTE" })
    pintar()

    expect(await screen.findByText(/recibimos tu pedido sol-8/i)).toBeTruthy()
    expect(enviar).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(leerPedidoPendiente()).toBeNull())
  })

  it("si el servicio aún no existe (501), avisa y conserva el pedido", async () => {
    guardarPedidoPendiente({ marca: "", numeroParte: "", descripcion: "Rodamiento", cantidad: 1 })
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockRejectedValue({ isAxiosError: true, response: { status: 501 } })
    pintar()

    expect(await screen.findByText(/todavía no está disponible/i)).toBeTruthy()
    expect(leerPedidoPendiente()).not.toBeNull()
    expect((screen.getByLabelText(/qué repuesto necesitas/i) as HTMLTextAreaElement).value).toBe("Rodamiento")
  })

  describe("botón mientras se envía", () => {
    it("pasa a «Procesando...», se deshabilita con spinner y no deja enviar dos veces", async () => {
      localStorage.setItem("cliente_access_token", "tok")
      let resolver!: (v: unknown) => void
      enviar.mockReturnValue(new Promise((r) => { resolver = r }))
      pintar()
      llenar()
      fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

      const boton = await screen.findByRole("button", { name: /procesando\.\.\./i }) as HTMLButtonElement
      expect(boton.disabled).toBe(true)
      expect(boton.getAttribute("aria-busy")).toBe("true")
      expect(boton.querySelector("svg.animate-spin")).not.toBeNull()
      fireEvent.click(boton)
      fireEvent.submit(boton.closest("form") as HTMLFormElement)
      expect(enviar).toHaveBeenCalledTimes(1)

      resolver({ idSolicitud: 7, codigoSolicitud: "SOL-7", estado: "PENDIENTE" })
      expect(await screen.findByText(/recibimos tu pedido sol-7/i)).toBeTruthy()
    })

    it("en reposo el botón dice «Pedir cotización» y está habilitado", () => {
      pintar()
      const boton = screen.getByRole("button", { name: /pedir cotización/i }) as HTMLButtonElement
      expect(boton.disabled).toBe(false)
      expect(boton.getAttribute("aria-busy")).toBeNull()
    })
  })
})
