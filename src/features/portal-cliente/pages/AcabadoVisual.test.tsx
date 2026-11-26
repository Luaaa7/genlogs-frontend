import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactElement } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { portalComprobantesApi, type ComprobantePortal } from "@/api/portalComprobantesApi"
import { portalCotizacionesApi, type CotizacionPortal } from "@/api/portalCotizacionesApi"
import { despachosApi } from "@/features/despacho/api/despachosApi"
import * as ingresoGoogleApi from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { repuestosApi, type RepuestoPortal } from "../repuestos/repuestosApi"
import { RepuestosPage } from "../repuestos/RepuestosPage"
import { MisComprobantesPage } from "./MisComprobantesPage"
import { MisCotizacionesPage } from "./MisCotizacionesPage"
import { MisDespachosPage } from "./MisDespachosPage"
import { MisPedidosPage } from "./MisPedidosPage"
import { PerfilClientePage } from "./PerfilClientePage"

function pintar(pagina: ReactElement) {
  localStorage.setItem("cliente_access_token", "token")
  sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Luana", rol: "CLIENTE" }))
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><Routes><Route path="*" element={pagina} /></Routes></MemoryRouter>
    </QueryClientProvider>,
  )
}

const pedidos = [
  { id: 1, codigo: "SOL-1", fecha: "2026-11-10T10:00:00", estado: "PENDIENTE", asunto: "Filtros" },
  { id: 2, codigo: "SOL-2", fecha: "2026-11-10T11:00:00", estado: "EN_REVISION", asunto: "Rodamientos" },
  { id: 3, codigo: "SOL-3", fecha: "2026-11-10T12:00:00", estado: "COTIZADA", asunto: "Mangueras" },
]
const cotizacion = (id: number): CotizacionPortal => ({ id, codigo: `COT-${id}`, fechaCotizacion: "2026-11-10", fechaValidez: "2026-12-30", estado: "Enviada", subtotal: 100, igv: 18, total: 118, moneda: "PEN", lineas: [] })
const comprobante = (id: number): ComprobantePortal => ({
  id, comprobante: `F001-0000000${id}`, tipo: "Factura", fechaEmision: "2026-11-20", fechaVencimiento: "2026-12-20", total: 118, montoPagado: 0,
  saldoPendiente: 118, moneda: "PEN", estado: "Emitida", codigoEstado: "EMITIDA", puedePagarEnLinea: false, motivoSinPago: null,
})
const repuesto = (id: number): RepuestoPortal => ({
  idProducto: id, nombre: `Repuesto ${id}`, descripcion: null, marca: "Caterpillar", numeroParte: `P-${id}`, idCategoria: 1, categoria: "Filtros",
  unidad: "Unidad", tipoRepuesto: "OEM", plazoEntrega: "5 días", urlImagen: null, precioReferencial: 10, moneda: "PEN",
})

const retardo = (el: Element) => (el as HTMLElement).style.animationDelay

describe("Acabado visual del portal", () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe("encabezado homologado (degradado azul acero y montañas)", () => {
    const casos: Array<[string, () => void, ReactElement]> = [
      ["Mis pedidos", () => vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([]), <MisPedidosPage />],
      ["Mis cotizaciones", () => vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([]), <MisCotizacionesPage />],
      ["Mis comprobantes", () => vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([]), <MisComprobantesPage />],
      ["Mis despachos", () => vi.spyOn(despachosApi, "listarPortal").mockResolvedValue([]), <MisDespachosPage />],
      ["Repuestos", () => { vi.spyOn(repuestosApi, "listar").mockResolvedValue([]); vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([]) }, <RepuestosPage />],
      ["Mi perfil", () => vi.spyOn(ingresoGoogleApi, "obtenerCuentaPortal").mockResolvedValue({ nombre: "Luana", correo: "l@e.pe", perfilCompleto: true, empresa: "Mina" }), <PerfilClientePage />],
    ]
    it.each(casos)("%s usa el mismo banner del portal", (titulo, simular, pagina) => {
      simular()
      pintar(pagina)
      const banner = screen.getByRole("heading", { level: 1, name: titulo }).closest("header") as HTMLElement
      expect(banner.className).toContain("from-[#EEF3F8]")
      expect(banner.className).toContain("dark:from-[#10213B]")
      expect(banner.querySelector("svg[aria-hidden='true']")).toBeTruthy()
      expect(within(banner).getByText("Portal del cliente")).toBeTruthy()
    })
  })

  describe("Mis pedidos", () => {
    it("las tarjetas entran escalonadas y se elevan al pasar el cursor, con la flecha de «Ver detalle» en movimiento", async () => {
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
      pintar(<MisPedidosPage />)
      await screen.findByText("Filtros")
      const tarjetas = screen.getAllByRole("article")
      expect(tarjetas.map(retardo)).toEqual(["0ms", "60ms", "120ms"])
      for (const t of tarjetas) {
        expect(t.className).toContain("animate-[tarjeta-entra_")
        expect(t.className).toContain("hover:-translate-y-0.5")
        expect(t.className).toContain("hover:shadow-md")
        expect(t.className).toContain("group")
      }
      expect(within(tarjetas[0]).getByRole("link", { name: /ver detalle de filtros/i }).querySelector("svg")?.getAttribute("class")).toContain("group-hover:translate-x-1")
    })

    it("al cambiar de filtro las tarjetas vuelven a entrar (se vuelven a montar)", async () => {
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
      pintar(<MisPedidosPage />)
      await screen.findByText("Filtros")
      const antes = screen.getByText("Filtros").closest("article")

      fireEvent.click(screen.getByRole("button", { name: /^Recibida/ }))

      const despues = screen.getByText("Filtros").closest("article")
      expect(despues).not.toBe(antes)
    })

    it("un filtro sin resultados muestra la ilustración y un botón que restablece el filtro", async () => {
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
      pintar(<MisPedidosPage />)
      await screen.findByText("Filtros")
      fireEvent.click(screen.getByRole("button", { name: /^Cancelada/ }))

      expect(screen.getByTestId("ilustracion-vacia")).toBeTruthy()
      expect(screen.getByText("No hay pedidos para mostrar")).toBeTruthy()
      fireEvent.click(screen.getByRole("button", { name: "Ver todos los pedidos" }))

      expect(screen.getByText("Filtros")).toBeTruthy()
      expect(screen.queryByTestId("ilustracion-vacia")).toBeNull()
    })

    it("sin pedidos invita a crear la primera solicitud", async () => {
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
      pintar(<MisPedidosPage />)
      expect(await screen.findByTestId("ilustracion-vacia")).toBeTruthy()
      expect(screen.getByRole("link", { name: "Crear mi primera solicitud" }).getAttribute("href")).toBe("/portal/solicitud")
    })
  })

  describe("Mis cotizaciones", () => {
    it("cada cotización es una tarjeta que entra escalonada, se eleva y mueve su flecha", async () => {
      vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([cotizacion(1), cotizacion(2)])
      pintar(<MisCotizacionesPage />)
      const enlaces = await screen.findAllByRole("link", { name: /COT-/ })
      const tarjetas = enlaces.map((e) => e.closest("li") as HTMLElement)
      expect(tarjetas.map(retardo)).toEqual(["0ms", "60ms"])
      for (const t of tarjetas) {
        expect(t.className).toContain("hover:-translate-y-0.5")
        expect(t.className).toContain("group")
        expect(t.className).toContain("rounded-xl")
        expect(t.querySelector("svg.group-hover\\:translate-x-1")).toBeTruthy()
      }
    })

    it("sin cotizaciones muestra la ilustración y el acceso a crear una solicitud", async () => {
      vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([])
      pintar(<MisCotizacionesPage />)
      expect(await screen.findByTestId("ilustracion-vacia")).toBeTruthy()
      expect(screen.getByText("Todavía no tienes cotizaciones")).toBeTruthy()
      expect(screen.getByRole("link", { name: "Crear mi primera solicitud" })).toBeTruthy()
    })
  })

  describe("Mis comprobantes y Mis despachos", () => {
    it("los comprobantes entran escalonados y se elevan", async () => {
      vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([comprobante(1), comprobante(2)])
      pintar(<MisComprobantesPage />)
      await screen.findByText("F001-00000001")
      const tarjetas = screen.getAllByRole("listitem")
      expect(tarjetas.map(retardo)).toEqual(["0ms", "60ms"])
      expect(tarjetas[0].className).toContain("hover:-translate-y-0.5")
    })

    it("sin comprobantes ni despachos se ve la ilustración", async () => {
      vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([])
      const { unmount } = pintar(<MisComprobantesPage />)
      expect(await screen.findByTestId("ilustracion-vacia")).toBeTruthy()
      unmount()

      vi.spyOn(despachosApi, "listarPortal").mockResolvedValue([])
      pintar(<MisDespachosPage />)
      expect(await screen.findByTestId("ilustracion-vacia")).toBeTruthy()
    })

    it("los despachos entran escalonados y se elevan", async () => {
      vi.spyOn(despachosApi, "listarPortal").mockResolvedValue([
        { id: 1, etapa: "EN_RUTA", etapaNombre: "En ruta", plazoDesde: null, plazoHasta: null, numeroOrdenCompra: "OC-1" },
        { id: 2, etapa: "EN_RUTA", etapaNombre: "En ruta", plazoDesde: null, plazoHasta: null, numeroOrdenCompra: "OC-2" },
      ] as never)
      pintar(<MisDespachosPage />)
      await screen.findByText("Orden OC-1")
      const tarjetas = screen.getAllByRole("listitem")
      expect(tarjetas.map(retardo)).toEqual(["0ms", "60ms"])
      expect(tarjetas[1].className).toContain("hover:shadow-md")
    })
  })

  describe("Repuestos", () => {
    it("las tarjetas entran escalonadas y se elevan", async () => {
      vi.spyOn(repuestosApi, "listar").mockResolvedValue([repuesto(1), repuesto(2)])
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
      pintar(<RepuestosPage />)
      const titulo = await screen.findByText("Repuesto 1")
      const tarjeta = titulo.closest("li") as HTMLElement
      expect(retardo(tarjeta)).toBe("0ms")
      expect(tarjeta.className).toContain("hover:-translate-y-0.5")
      expect(retardo(screen.getByText("Repuesto 2").closest("li") as HTMLElement)).toBe("60ms")
    })

    it("sin resultados muestra la ilustración y «Limpiar búsqueda» restablece la lista", async () => {
      const listar = vi.spyOn(repuestosApi, "listar").mockResolvedValue([repuesto(1)])
      vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
      pintar(<RepuestosPage />)
      await screen.findByText("Repuesto 1")

      listar.mockResolvedValue([])
      fireEvent.change(screen.getByLabelText("Buscar por nombre o N.º de parte"), { target: { value: "zzz" } })
      fireEvent.click(screen.getByRole("button", { name: "Buscar" }))
      expect(await screen.findByTestId("ilustracion-vacia")).toBeTruthy()

      listar.mockResolvedValue([repuesto(1)])
      fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }))
      expect(await screen.findByText("Repuesto 1")).toBeTruthy()
      expect((screen.getByLabelText("Buscar por nombre o N.º de parte") as HTMLInputElement).value).toBe("")
    })
  })

  describe("Perfil", () => {
    it("sus tarjetas de datos y contraseña entran escalonadas", async () => {
      vi.spyOn(ingresoGoogleApi, "obtenerCuentaPortal").mockResolvedValue({ nombre: "Luana", correo: "l@e.pe", perfilCompleto: true, empresa: "Mina" })
      pintar(<PerfilClientePage />)
      await screen.findByText("l@e.pe")
      const secciones = screen.getAllByRole("region")
      expect(secciones.map(retardo)).toEqual(["0ms", "60ms"])
      await waitFor(() => expect(secciones[0].className).toContain("animate-[tarjeta-entra_"))
    })
  })
})
