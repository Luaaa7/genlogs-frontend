import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import type { Referencia } from "@/api/sourcingApi"
import { formatCurrency } from "@/lib/formatters/currency"

const api = vi.hoisted(() => ({
  buscar: vi.fn(),
  historial: vi.fn(),
  cambiarEstado: vi.fn(),
  leerUrl: vi.fn(),
  guardarUrl: vi.fn(),
  tipoCambioDelDia: vi.fn().mockRejectedValue(new Error("404")),
}))
vi.mock("@/api/sourcingApi", () => ({ sourcingApi: api }))

import { useAuthStore } from "@/features/auth/store/authStore"
import { BusquedaPage } from "./BusquedaPage"

const ref = (over: Partial<Referencia> = {}): Referencia => ({
  idSourcing: 1, idSolicitudItem: null, fuente: "EBAY", metodo: "NUMERO_PARTE",
  titulo: "Filtro CAT 1R-0750", marca: "Caterpillar", numeroParte: "1R-0750",
  precioRef: 18.5, codigoMoneda: "USD", costoPuestoLima: null,
  urlReferencia: "https://www.ebay.com/itm/1", urlImagenRef: null,
  estado: "CAPTURADO", editadoAMano: false, creadoEn: "2026-11-11T10:00:00",
  ...over,
})

function plano(texto: string) {
  return texto.replace(/\u00A0/g, " ")
}

function filaDe(titulo: string) {
  const fila = screen.getByText(titulo).closest("tr")
  expect(fila).toBeTruthy()
  return fila as HTMLElement
}

function pintar(ruta = "/busqueda") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>
        <BusquedaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("BusquedaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ nombreRol: "ASISTENTE_LOGISTICO" })
  })

  it("pide el N.º de parte antes de buscar", async () => {
    pintar()
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))
    expect(await screen.findByText(/escribe el n\.º de parte/i)).toBeTruthy()
    expect(api.buscar).not.toHaveBeenCalled()
  })

  it("busca, muestra las referencias y permite marcarlas como útiles", async () => {
    api.buscar.mockResolvedValue({ reutilizada: false, fuentesConsultadas: ["EBAY"], fuentesConError: [], sugerirUrl: false, referencias: [ref()] })
    api.historial.mockResolvedValue([ref()])
    api.cambiarEstado.mockResolvedValue(ref({ estado: "UTIL" }))
    pintar()

    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: " 1R-0750 " } })
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))

    await waitFor(() => expect(api.buscar).toHaveBeenCalledWith(expect.objectContaining({ numeroParte: "1R-0750", forzar: false })))
    expect(await screen.findByText("Filtro CAT 1R-0750")).toBeTruthy()
    expect(screen.getByText(/se consultó: ebay/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /marcar como útil/i }))
    await waitFor(() => expect(api.cambiarEstado).toHaveBeenCalledWith(1, "UTIL"))
  })

  it("si reutiliza la búsqueda de las últimas 24 h, ofrece buscar de nuevo en las fuentes", async () => {
    api.buscar.mockResolvedValue({ reutilizada: true, fuentesConsultadas: [], fuentesConError: [], sugerirUrl: false, referencias: [ref()] })
    api.historial.mockResolvedValue([ref()])
    pintar("/busqueda?numeroParte=1R-0750")

    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))
    expect(await screen.findByText(/últimas 24 horas/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /buscar de nuevo en las fuentes/i }))
    await waitFor(() => expect(api.buscar).toHaveBeenLastCalledWith(expect.objectContaining({ forzar: true })))
  })

  it("sin referencias, sugiere buscar en una tienda y pegar la URL", async () => {
    api.buscar.mockResolvedValue({ reutilizada: false, fuentesConsultadas: [], fuentesConError: [], sugerirUrl: true, referencias: [] })
    api.historial.mockResolvedValue([])
    pintar("/busqueda?numeroParte=XYZ-1")

    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))
    expect(await screen.findByText(/sin referencias para este n\.º de parte/i)).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: /pegar url/i })[1])
    expect(screen.getByRole("dialog", { name: /pegar url de una tienda/i })).toBeTruthy()
  })

  it("muestra eBay y Mercado Libre con su precio, y no inventa la fuente que no viene", async () => {
    const ebay = ref()
    const mercadoLibre = ref({
      idSourcing: 2,
      fuente: "MERCADO_LIBRE",
      titulo: "Filtro CAT en Mercado Libre",
      precioRef: 95,
      codigoMoneda: "PEN",
      urlReferencia: "https://articulo.mercadolibre.com.pe/ejemplo-2",
    })
    api.buscar.mockResolvedValue({
      reutilizada: false,
      fuentesConsultadas: ["EBAY", "MERCADO_LIBRE"],
      fuentesConError: [],
      sugerirUrl: false,
      referencias: [ebay, mercadoLibre],
    })
    api.historial.mockResolvedValue([ebay, mercadoLibre])
    const conAmbas = pintar()
    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))

    expect(await screen.findByText("eBay")).toBeTruthy()
    expect(screen.getByText("Mercado Libre")).toBeTruthy()
    expect(plano(filaDe("Filtro CAT 1R-0750").textContent ?? "")).toContain(plano(formatCurrency(18.5, "USD")))
    expect(plano(filaDe("Filtro CAT en Mercado Libre").textContent ?? "")).toContain(plano(formatCurrency(95, "PEN")))
    conAmbas.unmount()

    api.buscar.mockResolvedValue({
      reutilizada: false,
      fuentesConsultadas: ["EBAY"],
      fuentesConError: [],
      sugerirUrl: false,
      referencias: [ebay],
    })
    api.historial.mockResolvedValue([ebay])
    pintar()
    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))
    expect(await screen.findByText("eBay")).toBeTruthy()
    expect(screen.queryByText("Mercado Libre")).toBeNull()
    expect(screen.queryByText("Filtro CAT en Mercado Libre")).toBeNull()
  })

  it("si Mercado Libre no responde, eBay sigue visible y se lee el fallo", async () => {
    const ebay = ref()
    api.buscar.mockResolvedValue({
      reutilizada: false,
      fuentesConsultadas: ["EBAY"],
      fuentesConError: ["MERCADO_LIBRE"],
      sugerirUrl: false,
      referencias: [ebay],
    })
    api.historial.mockResolvedValue([ebay])
    pintar()
    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))

    expect(await screen.findByText("Filtro CAT 1R-0750")).toBeTruthy()
    expect(screen.getByText("eBay")).toBeTruthy()
    expect(screen.getByText(/No respondieron: MERCADO_LIBRE/)).toBeTruthy()
    expect(screen.queryByText("Mercado Libre")).toBeNull()
  })

  it("el Gerente solo ve el historial: no busca en las fuentes ni marca", async () => {
    useAuthStore.setState({ nombreRol: "GERENTE_GENERAL" })
    api.historial.mockResolvedValue([ref({ estado: "UTIL" })])
    pintar("/busqueda?numeroParte=1R-0750")

    expect(await screen.findByText("Filtro CAT 1R-0750")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /ver historial/i }))
    expect(api.buscar).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: /marcar como útil/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /pegar url/i })).toBeNull()
  })
})
