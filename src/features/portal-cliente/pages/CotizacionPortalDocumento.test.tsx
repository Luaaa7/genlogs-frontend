import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { portalCotizacionesApi, type CotizacionPortal } from "@/api/portalCotizacionesApi"
import { obtenerCuentaPortal } from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { CotizacionPortalDetallePage } from "./CotizacionPortalDetallePage"

vi.mock("@/features/acceso-cliente/api/ingresoGoogleApi", async (original) => ({
  ...(await original<typeof import("@/features/acceso-cliente/api/ingresoGoogleApi")>()),
  obtenerCuentaPortal: vi.fn(),
}))

function pintar(c: CotizacionPortal) {
  vi.spyOn(portalCotizacionesApi, "detalle").mockResolvedValue(c)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/portal/cotizaciones/${c.id}`]}>
        <Routes>
          <Route path="/portal/cotizaciones/:id" element={<CotizacionPortalDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const aceptada: CotizacionPortal = {
  id: 5, codigo: "20260610-01ADM", fechaCotizacion: "2026-11-10", fechaValidez: "2026-11-17", estado: "Aceptada por el cliente",
  subtotal: 1000, igv: 180, total: 1180, moneda: "PEN",
  lineas: [
    { descripcion: "Filtro de aceite", cantidad: 1, unidad: "Unidad", precioUnitario: 100, importe: 100 },
    { descripcion: "Perno de anclaje", cantidad: 2, unidad: "Unidad", precioUnitario: 50, importe: 100 },
    { descripcion: "Arandela plana", cantidad: 60, unidad: "Unidad", precioUnitario: 12, importe: 720 },
  ],
}

describe("Detalle de cotización como documento B2B", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Gina", rol: "CLIENTE" }))
    vi.mocked(obtenerCuentaPortal).mockResolvedValue({ nombre: "Gina", correo: "gina@minera.pe", perfilCompleto: true, empresa: "Minera Los Andes S.A.C." })
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    sessionStorage.clear()
  })

  describe("cabecera", () => {
    it("conserva el código y el estado, y pone GENLOGS S.A.C. a un lado y al cliente al otro", async () => {
      pintar(aceptada)
      expect(await screen.findByRole("heading", { level: 1, name: "20260610-01ADM" })).toBeTruthy()
      expect(screen.getByText("Aceptada por el cliente")).toBeTruthy()

      const emisor = screen.getByRole("group", { name: "Emisor" })
      expect(within(emisor).getByText("GENLOGS S.A.C.")).toBeTruthy()

      const cliente = await screen.findByRole("group", { name: "Cliente" })
      expect(within(cliente).getByText("Razón social").nextElementSibling?.textContent).toBe("Minera Los Andes S.A.C.")
    })

    it("no inventa el RUC: la cuenta y la cotización no lo traen", async () => {
      pintar(aceptada)
      await screen.findByRole("group", { name: "Cliente" })
      expect(screen.queryByText("RUC")).toBeNull()
    })

    it("sin empresa en la cuenta no muestra el bloque del cliente", async () => {
      vi.mocked(obtenerCuentaPortal).mockResolvedValue({ nombre: "Gina", correo: "g@x.pe", perfilCompleto: false, empresa: null })
      pintar(aceptada)
      await screen.findByRole("heading", { level: 1, name: "20260610-01ADM" })
      expect(screen.queryByRole("group", { name: "Cliente" })).toBeNull()
    })

    it("muestra en una grilla la fecha de emisión, la validez y la moneda", async () => {
      pintar(aceptada)
      const meta = await screen.findByRole("group", { name: "Datos de la cotización" })
      expect(within(meta).getByText("Fecha de emisión").nextElementSibling?.textContent).toBe("10/11/2026")
      expect(within(meta).getByText("Válida hasta").nextElementSibling?.textContent).toBe("17/11/2026")
      expect(within(meta).getByText("Moneda").nextElementSibling?.textContent).toBe("Soles (PEN)")
    })

    it("no muestra «Plazo de entrega»: el DTO de la cotización no lo trae", async () => {
      pintar(aceptada)
      await screen.findByRole("group", { name: "Datos de la cotización" })
      expect(screen.queryByText(/plazo de entrega/i)).toBeNull()
    })

    it("sin fecha de emisión ni de validez no inventa fechas", async () => {
      pintar({ ...aceptada, fechaCotizacion: undefined, fechaValidez: null })
      const meta = await screen.findByRole("group", { name: "Datos de la cotización" })
      expect(within(meta).queryByText("Fecha de emisión")).toBeNull()
      expect(within(meta).getByText("Válida hasta").nextElementSibling?.textContent).toBe("Sin fecha de validez")
    })
  })

  describe("imprimir", () => {
    it("el botón «Imprimir / PDF» abre la impresión del navegador", async () => {
      const imprimir = vi.spyOn(window, "print").mockImplementation(() => {})
      pintar(aceptada)
      fireEvent.click(await screen.findByRole("button", { name: "Imprimir / PDF" }))
      expect(imprimir).toHaveBeenCalledTimes(1)
    })

    it("al imprimir se oculta lo que no es del documento: el botón, el enlace de volver y las acciones", async () => {
      pintar({ ...aceptada, estado: "Enviada", fechaValidez: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10) })
      const boton = await screen.findByRole("button", { name: "Imprimir / PDF" })
      expect(boton.className).toContain("print:hidden")
      expect(screen.getByRole("link", { name: /volver a mis cotizaciones/i }).className).toContain("print:hidden")
      expect(screen.getByLabelText(/comentario/i).closest("div[class*='print:hidden']")).toBeTruthy()
    })
  })

  describe("tabla", () => {
    it("pluraliza la unidad según la cantidad: 1 Unidad, 2 Unidades, 60 Unidades", async () => {
      pintar(aceptada)
      await screen.findByText("Filtro de aceite")
      expect(screen.getByText("1 Unidad")).toBeTruthy()
      expect(screen.getByText("2 Unidades")).toBeTruthy()
      expect(screen.getByText("60 Unidades")).toBeTruthy()
    })

    it("cantidades, precios unitarios e importes usan cifras tabulares", async () => {
      pintar(aceptada)
      const celda = (await screen.findByText("60 Unidades")).closest("td")
      expect(celda?.className).toContain("tabular-nums")
      const fila = celda?.closest("tr")
      for (const td of Array.from(fila?.querySelectorAll("td") ?? []).slice(1)) expect(td.className).toContain("tabular-nums")
    })
  })

  describe("pie comercial", () => {
    it("tras los totales va una nota sobre la validez de la oferta y la moneda", async () => {
      pintar(aceptada)
      const nota = await screen.findByRole("note")
      expect(nota.textContent).toMatch(/oferta válida hasta el 17\/11\/2026/i)
      expect(nota.textContent).toMatch(/soles \(PEN\)/i)
      const total = screen.getByText("Total")
      expect(total.compareDocumentPosition(nota) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("sin fecha de validez la nota no inventa una", async () => {
      pintar({ ...aceptada, fechaValidez: null })
      const nota = await screen.findByRole("note")
      expect(nota.textContent).not.toMatch(/válida hasta/i)
    })

    it("si ya está aceptada ofrece ir a Mis pedidos", async () => {
      pintar(aceptada)
      const enlace = await screen.findByRole("link", { name: /ver mis pedidos/i })
      expect(enlace.getAttribute("href")).toBe("/portal/pedidos")
      expect(enlace.className).toContain("print:hidden")
    })

    it("si todavía no está aceptada no ofrece ir a Mis pedidos", async () => {
      pintar({ ...aceptada, estado: "Enviada" })
      await screen.findByRole("note")
      expect(screen.queryByRole("link", { name: /ver mis pedidos/i })).toBeNull()
    })
  })
})
