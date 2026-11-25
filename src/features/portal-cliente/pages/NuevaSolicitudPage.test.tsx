import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { CLAVE_BORRADOR } from "../lib/borradorSolicitud"
import { NuevaSolicitudPage } from "./NuevaSolicitudPage"

type Entrada = string | { pathname: string; state?: unknown; key?: string }

function renderPagina(entrada: Entrada = "/portal/solicitud") {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route path="/portal/solicitud" element={<NuevaSolicitudPage />} />
          <Route path="/portal/pedidos" element={<div>Mis pedidos</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const BOTON_NOTA = "+ Agregar una nota (opcional)"
const BOTON_ADJUNTO = "+ Adjuntar también foto o plano PDF (opcional)"
const BOTON_MAS_DATOS = "Más datos (opcional)"

const tarjeta = (n: number) => screen.getByRole("group", { name: `Repuesto ${n}` })
const radio = (n: number, texto: "Tengo el N.º de parte" | "Tengo una foto") =>
  screen.getByRole("radio", { name: `Repuesto ${n}: ${texto}` }) as HTMLInputElement
const modoFoto = (n: number) => fireEvent.click(radio(n, "Tengo una foto"))
const modoParte = (n: number) => fireEvent.click(radio(n, "Tengo el N.º de parte"))
const agregarRepuesto = () => fireEvent.click(screen.getByRole("button", { name: "Agregar otro repuesto" }))
const enviar = () => fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))
const archivo = (nombre = "pieza.jpg") => new File(["x"], nombre, { type: "image/jpeg" })

function abrirNota() {
  fireEvent.click(screen.getByRole("button", { name: BOTON_NOTA }))
}

function llenarGeneral() {
  fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "Filtros para cargador" } })
  abrirNota()
  fireEvent.change(screen.getByLabelText("Detalle de la solicitud"), { target: { value: "Para el mantenimiento de 500 horas." } })
}

function llenarRepuesto(n: number, datos: Partial<Record<"descripcion" | "cantidad" | "marca" | "numeroParte" | "gtin", string>>) {
  const campos: Record<string, string> = {
    descripcion: `Repuesto ${n}: descripción`,
    cantidad: `Repuesto ${n}: cantidad`,
    marca: `Repuesto ${n}: marca`,
    numeroParte: `Repuesto ${n}: N.º de parte`,
    gtin: `Repuesto ${n}: GTIN (opcional)`,
  }
  if (datos.gtin !== undefined && !screen.queryByLabelText(campos.gtin)) {
    fireEvent.click(within(tarjeta(n)).getByRole("button", { name: BOTON_MAS_DATOS }))
  }
  for (const [campo, valor] of Object.entries(datos)) {
    fireEvent.change(screen.getByLabelText(campos[campo]), { target: { value: valor } })
  }
}

/** Adjunta el archivo en el repuesto n (en modo parte abre antes el adjunto opcional). */
function adjuntar(n: number, file: File) {
  if (!screen.queryByLabelText(`Repuesto ${n}: foto o plano`)) {
    fireEvent.click(within(tarjeta(n)).getByRole("button", { name: BOTON_ADJUNTO }))
  }
  fireEvent.change(screen.getByLabelText(`Repuesto ${n}: foto o plano`), { target: { files: [file] } })
}

const CREADA = { idSolicitud: 10, codigoSolicitud: "SOL-10", estado: "PENDIENTE" } as const
const valorDe = (etiqueta: string) => (screen.getByLabelText(etiqueta) as HTMLInputElement).value

let desplazados: Element[]

describe("NuevaSolicitudPage (D-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
    desplazados = []
    // jsdom no trae scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
      desplazados.push(this)
    })
  })

  describe("envío", () => {
    it("envía marca, N.º de parte y GTIN de cada repuesto y vuelve a Mis pedidos", async () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro de aceite", cantidad: "2", marca: "Caterpillar", numeroParte: "1R-0750", gtin: "7750182002011" })

      enviar()

      await waitFor(() => expect(screen.getByText("Mis pedidos")).toBeTruthy())
      expect(crear.mock.calls[0][0]).toEqual({
        canal: "PORTAL",
        asunto: "Filtros para cargador",
        descripcion: "Para el mantenimiento de 500 horas.",
        items: [{
          descripcion: "Filtro de aceite", cantidad: 2, unidad: "UND",
          marcaTexto: "Caterpillar", numeroParte: "1R-0750", gtin: "7750182002011",
        }],
      })
    })

    it("sube la foto primero y manda su URL en el repuesto (modo foto)", async () => {
      const subir = vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      modoFoto(1)
      llenarRepuesto(1, { descripcion: "Pieza rota del chancador" })
      const foto = archivo()
      adjuntar(1, foto)

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(subir).toHaveBeenCalledWith(foto)
      expect(crear.mock.calls[0][0].items?.[0]).toMatchObject({ urlFoto: "https://res.cloudinary.com/x/pieza.jpg" })
      expect(crear.mock.calls[0][0].items[0].numeroParte).toBeUndefined()
    })

    it("en modo foto no manda el N.º de parte que quedó escrito antes de cambiar de modo", async () => {
      vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Pieza", marca: "Caterpillar", numeroParte: "1R-0750" })
      modoFoto(1)
      adjuntar(1, archivo())

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(crear.mock.calls[0][0].items[0].numeroParte).toBeUndefined()
      expect(crear.mock.calls[0][0].items[0].marcaTexto).toBe("Caterpillar")
    })

    it("si falla la subida de la foto avisa y no crea la solicitud", async () => {
      vi.spyOn(portalApi, "subirFotoSolicitud").mockRejectedValue(new Error("red"))
      const crear = vi.spyOn(portalApi, "crearSolicitud")
      renderPagina()
      llenarGeneral()
      modoFoto(1)
      llenarRepuesto(1, { descripcion: "Pieza rota" })
      adjuntar(1, new File(["x"], "pieza.png", { type: "image/png" }))

      enviar()

      expect(await screen.findByText(/no se pudo subir la foto/i)).toBeTruthy()
      expect(crear).not.toHaveBeenCalled()
    })

    it("si falla crear la solicitud, al reintentar no vuelve a subir la misma foto", async () => {
      const subir = vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(CREADA)
      renderPagina()
      llenarGeneral()
      modoFoto(1)
      llenarRepuesto(1, { descripcion: "Pieza rota" })
      adjuntar(1, archivo())

      enviar()
      await screen.findByText(/no se pudo enviar la solicitud/i)
      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalledTimes(2))
      expect(subir).toHaveBeenCalledTimes(1)
    })

    it("sin asunto no envía y lo avisa", () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud")
      renderPagina()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })
      fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "  " } })

      enviar()

      expect(screen.getByText(/escribe el asunto/i)).toBeTruthy()
      expect(crear).not.toHaveBeenCalled()
    })
  })

  describe("repuestos", () => {
    it("permite agregar y quitar repuestos", () => {
      renderPagina()
      expect(screen.queryByRole("button", { name: "Quitar repuesto 1" })).toBeNull()

      agregarRepuesto()
      expect(screen.getByLabelText("Repuesto 2: descripción")).toBeTruthy()

      fireEvent.click(screen.getByRole("button", { name: "Quitar repuesto 2" }))
      expect(screen.queryByLabelText("Repuesto 2: descripción")).toBeNull()
    })

    it("al quitar un repuesto, el que queda no hereda la foto del borrado", () => {
      renderPagina()
      modoFoto(1)
      adjuntar(1, archivo("del-primero.jpg"))
      agregarRepuesto()
      fireEvent.change(screen.getByLabelText("Repuesto 2: descripción"), { target: { value: "Segundo" } })

      fireEvent.click(screen.getByRole("button", { name: "Quitar repuesto 1" }))

      expect(valorDe("Repuesto 1: descripción")).toBe("Segundo")
      modoFoto(1)
      expect((screen.getByLabelText("Repuesto 1: foto o plano") as HTMLInputElement).files?.length ?? 0).toBe(0)
    })

    it("los errores quedan unidos a su campo para lectores de pantalla", () => {
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", numeroParte: "1R-0750", marca: "" })

      enviar()

      const marca = screen.getByLabelText("Repuesto 1: marca")
      expect(marca.getAttribute("aria-invalid")).toBe("true")
      const error = document.getElementById(marca.getAttribute("aria-describedby") ?? "")
      expect(error?.textContent).toMatch(/marca/i)
    })
  })

  describe("asunto automático", () => {
    it("se llena con la descripción del primer repuesto y suma los demás", () => {
      renderPagina()
      expect(valorDe("Asunto")).toBe("")

      llenarRepuesto(1, { descripcion: "Filtro de aceite del motor" })
      expect(valorDe("Asunto")).toBe("Filtro de aceite del motor")

      agregarRepuesto()
      expect(valorDe("Asunto")).toBe("Filtro de aceite del motor (+1 repuesto)")
      agregarRepuesto()
      expect(valorDe("Asunto")).toBe("Filtro de aceite del motor (+2 repuestos)")
    })

    it("si el cliente edita el asunto, respeta su texto y deja de sobrescribirlo", () => {
      renderPagina()
      llenarRepuesto(1, { descripcion: "Filtro de aceite del motor" })
      fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "Mantenimiento 500 h" } })

      llenarRepuesto(1, { descripcion: "Bomba de agua" })
      agregarRepuesto()

      expect(valorDe("Asunto")).toBe("Mantenimiento 500 h")
    })

    it("el asunto automático es el que se envía", async () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarRepuesto(1, { descripcion: "Filtro de aceite del motor", marca: "Caterpillar", numeroParte: "1R-0750" })
      agregarRepuesto()
      llenarRepuesto(2, { descripcion: "Bomba", marca: "Caterpillar", numeroParte: "2P-1234" })

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(crear.mock.calls[0][0].asunto).toBe("Filtro de aceite del motor (+1 repuesto)")
    })
  })

  describe("detalle como nota opcional", () => {
    it("empieza cerrado y se despliega con «+ Agregar una nota (opcional)»", () => {
      renderPagina()
      expect(screen.queryByLabelText("Detalle de la solicitud")).toBeNull()

      abrirNota()

      const nota = screen.getByLabelText("Detalle de la solicitud")
      expect(nota.getAttribute("placeholder")).toBe("Indica equipo, unidad minera o fecha requerida")
      expect(screen.queryByRole("button", { name: BOTON_NOTA })).toBeNull()
    })

    it("sin nota la solicitud se envía igual, sin el detalle", async () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(crear.mock.calls[0][0].descripcion).toBeUndefined()
    })
  })

  describe("selector «Tengo el N.º de parte» / «Tengo una foto»", () => {
    it("por defecto pide marca y N.º de parte, y deja la foto escondida", () => {
      renderPagina()
      expect(radio(1, "Tengo el N.º de parte").checked).toBe(true)
      expect(radio(1, "Tengo una foto").checked).toBe(false)
      expect(screen.getByLabelText("Repuesto 1: marca")).toBeTruthy()
      expect(screen.getByLabelText("Repuesto 1: N.º de parte")).toBeTruthy()
      expect(screen.queryByLabelText("Repuesto 1: foto o plano")).toBeNull()
    })

    it("en modo parte, la foto o plano es un adjunto opcional que se abre aparte", async () => {
      const subir = vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/plano.pdf")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })

      fireEvent.click(within(tarjeta(1)).getByRole("button", { name: BOTON_ADJUNTO }))
      const entrada = screen.getByLabelText("Repuesto 1: foto o plano")
      expect(entrada.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp,application/pdf")
      expect(within(tarjeta(1)).getByText(/hasta 10 MB/i)).toBeTruthy()
      const plano = new File(["x"], "plano.pdf", { type: "application/pdf" })
      fireEvent.change(entrada, { target: { files: [plano] } })

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(subir).toHaveBeenCalledWith(plano)
      expect(crear.mock.calls[0][0].items[0]).toMatchObject({ numeroParte: "1R-0750", urlFoto: "https://res.cloudinary.com/x/plano.pdf" })
    })

    it("en modo foto pide la foto, esconde el N.º de parte y deja la marca opcional", async () => {
      vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      modoFoto(1)

      expect(screen.queryByLabelText("Repuesto 1: N.º de parte")).toBeNull()
      expect(screen.getByLabelText("Repuesto 1: foto o plano")).toBeTruthy()
      expect(within(tarjeta(1)).getByText("(opcional)")).toBeTruthy()

      llenarRepuesto(1, { descripcion: "Pieza rota" })
      adjuntar(1, archivo())
      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(crear.mock.calls[0][0].items[0].marcaTexto).toBeUndefined()
    })

    it("en modo parte sin N.º de parte muestra el error y no envía", () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud")
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Pieza rota del chancador" })

      enviar()

      expect(within(tarjeta(1)).getByText(/indica el n\.º de parte/i)).toBeTruthy()
      expect(crear).not.toHaveBeenCalled()
    })

    it("en modo foto sin archivo muestra el error y no envía", () => {
      const crear = vi.spyOn(portalApi, "crearSolicitud")
      renderPagina()
      llenarGeneral()
      modoFoto(1)
      llenarRepuesto(1, { descripcion: "Pieza rota del chancador" })

      enviar()

      expect(within(tarjeta(1)).getByText(/adjunta una foto o plano/i)).toBeTruthy()
      expect(crear).not.toHaveBeenCalled()
    })

    it("al ir y volver de modo conserva lo escrito y React no mezcla los campos de texto con los de archivo", () => {
      const consola = vi.spyOn(console, "error").mockImplementation(() => {})
      renderPagina()
      llenarRepuesto(1, { marca: "Caterpillar", numeroParte: "1R-0750" })

      modoFoto(1)
      expect(valorDe("Repuesto 1: marca")).toBe("Caterpillar")
      modoParte(1)

      expect(valorDe("Repuesto 1: N.º de parte")).toBe("1R-0750")
      expect(consola).not.toHaveBeenCalled()
    })

    it("al cambiar de modo se limpia el error de ese repuesto y no el de los demás", () => {
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Pieza uno" })
      agregarRepuesto()
      llenarRepuesto(2, { descripcion: "Pieza dos" })
      enviar()
      expect(within(tarjeta(1)).getByText(/indica el n\.º de parte/i)).toBeTruthy()
      expect(within(tarjeta(2)).getByText(/indica el n\.º de parte/i)).toBeTruthy()

      modoFoto(1)

      expect(within(tarjeta(1)).queryByText(/indica el n\.º de parte/i)).toBeNull()
      expect(within(tarjeta(1)).queryByText(/adjunta una foto/i)).toBeNull()
      expect(within(tarjeta(2)).getByText(/indica el n\.º de parte/i)).toBeTruthy()
    })
  })

  describe("GTIN dentro de «Más datos (opcional)»", () => {
    it("empieza cerrado y se abre con el botón", () => {
      renderPagina()
      expect(screen.queryByLabelText("Repuesto 1: GTIN (opcional)")).toBeNull()

      const boton = within(tarjeta(1)).getByRole("button", { name: BOTON_MAS_DATOS })
      expect(boton.getAttribute("aria-expanded")).toBe("false")
      fireEvent.click(boton)

      expect(screen.getByLabelText("Repuesto 1: GTIN (opcional)")).toBeTruthy()
      expect(boton.getAttribute("aria-expanded")).toBe("true")
    })

    it("si el GTIN es inválido y el cliente cerró «Más datos», se vuelve a abrir con el error", () => {
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750", gtin: "123" })
      fireEvent.click(within(tarjeta(1)).getByRole("button", { name: BOTON_MAS_DATOS }))
      expect(screen.queryByLabelText("Repuesto 1: GTIN (opcional)")).toBeNull()

      enviar()

      expect(screen.getByLabelText("Repuesto 1: GTIN (opcional)")).toBeTruthy()
      expect(within(tarjeta(1)).getByText(/el gtin no es válido/i)).toBeTruthy()
    })
  })

  describe("validación con desplazamiento", () => {
    it("marca todos los repuestos con error y baja hasta el primero", () => {
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })
      agregarRepuesto()
      llenarRepuesto(2, { descripcion: "Bomba sin código" })
      agregarRepuesto()

      enviar()

      expect(within(tarjeta(2)).getByText(/indica el n\.º de parte/i)).toBeTruthy()
      expect(within(tarjeta(3)).getByText(/describe el repuesto/i)).toBeTruthy()
      expect(desplazados).toEqual([tarjeta(2)])
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" })
    })

    it("sin errores no se desplaza a ningún repuesto", async () => {
      vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })

      enviar()

      await waitFor(() => expect(screen.getByText("Mis pedidos")).toBeTruthy())
      expect(desplazados).toEqual([])
    })
  })

  describe("borrador en sessionStorage", () => {
    const leer = () => JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) ?? "null")

    it("guarda lo escrito sin los archivos y marca si había un adjunto", () => {
      renderPagina()
      llenarGeneral()
      modoFoto(1)
      llenarRepuesto(1, { descripcion: "Pieza rota" })
      adjuntar(1, archivo())

      const borrador = leer()
      expect(borrador).toMatchObject({
        asunto: "Filtros para cargador",
        asuntoEditado: true,
        detalle: "Para el mantenimiento de 500 horas.",
        notaAbierta: true,
        teniaAdjunto: true,
      })
      expect(borrador.items[0]).toMatchObject({ modo: "foto", descripcion: "Pieza rota" })
      expect(borrador.items[0]).not.toHaveProperty("foto")
      expect(sessionStorage.getItem(CLAVE_BORRADOR)).not.toContain("pieza.jpg")
    })

    it("al recargar restaura el texto y avisa que los archivos hay que volver a adjuntarlos", () => {
      const primera = renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750", gtin: "7750182002011" })
      agregarRepuesto()
      modoFoto(2)
      llenarRepuesto(2, { descripcion: "Pieza rota" })
      adjuntar(2, archivo())
      primera.unmount()

      renderPagina()

      expect(valorDe("Asunto")).toBe("Filtros para cargador")
      expect(valorDe("Detalle de la solicitud")).toBe("Para el mantenimiento de 500 horas.")
      expect(valorDe("Repuesto 1: descripción")).toBe("Filtro")
      expect(valorDe("Repuesto 1: N.º de parte")).toBe("1R-0750")
      expect(valorDe("Repuesto 1: GTIN (opcional)")).toBe("7750182002011") // abierto porque ya tenía valor
      expect(radio(2, "Tengo una foto").checked).toBe(true)
      expect(valorDe("Repuesto 2: descripción")).toBe("Pieza rota")
      expect(screen.getByText(/no se conservan al recargar/i)).toBeTruthy()
      expect((screen.getByLabelText("Repuesto 2: foto o plano") as HTMLInputElement).files?.length ?? 0).toBe(0)
    })

    it("al recargar sin archivos no muestra el aviso", () => {
      const primera = renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })
      primera.unmount()

      renderPagina()

      expect(valorDe("Repuesto 1: descripción")).toBe("Filtro")
      expect(screen.queryByText(/no se conservan al recargar/i)).toBeNull()
    })

    it("si el cliente no había editado el asunto, sigue siendo automático después de recargar", () => {
      const primera = renderPagina()
      llenarRepuesto(1, { descripcion: "Filtro de aceite del motor" })
      primera.unmount()

      renderPagina()
      expect(valorDe("Asunto")).toBe("Filtro de aceite del motor")
      agregarRepuesto()
      expect(valorDe("Asunto")).toBe("Filtro de aceite del motor (+1 repuesto)")
    })

    it("al enviar con éxito borra el borrador antes de volver a Mis pedidos", async () => {
      vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina()
      llenarGeneral()
      llenarRepuesto(1, { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750" })
      expect(leer()).not.toBeNull()

      enviar()

      await waitFor(() => expect(screen.getByText("Mis pedidos")).toBeTruthy())
      expect(sessionStorage.getItem(CLAVE_BORRADOR)).toBeNull()
    })

    it("un borrador dañado no rompe la página", () => {
      sessionStorage.setItem(CLAVE_BORRADOR, "esto no es json")
      renderPagina()
      expect(screen.getByLabelText("Repuesto 1: descripción")).toBeTruthy()
      expect(valorDe("Asunto")).toBe("")
    })
  })

  describe("repuestos precargados desde /portal/repuestos (location.state)", () => {
    const repuestos = [
      { descripcion: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750", unidad: "UND", cantidad: 3 },
      { descripcion: "Pieza sin código", cantidad: 1, urlFoto: "https://res.cloudinary.com/x/pieza.jpg" },
    ]
    const desdeCarrito = (key = "k1") => ({ pathname: "/portal/solicitud", state: { repuestos }, key })

    it("los carga, elige el modo de cada uno y avisa cuántos son", () => {
      renderPagina(desdeCarrito())

      expect(screen.getByText(/se precargaron 2 repuestos/i)).toBeTruthy()
      expect(valorDe("Repuesto 1: descripción")).toBe("Filtro de combustible")
      expect(valorDe("Repuesto 1: cantidad")).toBe("3")
      expect(valorDe("Repuesto 1: N.º de parte")).toBe("1R-0750")
      expect(radio(1, "Tengo el N.º de parte").checked).toBe(true)
      expect(valorDe("Repuesto 2: descripción")).toBe("Pieza sin código")
      expect(radio(2, "Tengo una foto").checked).toBe(true)
      expect(valorDe("Asunto")).toBe("Filtro de combustible (+1 repuesto)")
    })

    it("con un solo repuesto el aviso va en singular", () => {
      renderPagina({ pathname: "/portal/solicitud", state: { repuestos: [repuestos[0]] }, key: "k1" })
      expect(screen.getByText(/se precargó 1 repuesto/i)).toBeTruthy()
    })

    it("sin repuestos en el state arranca con uno vacío y sin aviso", () => {
      renderPagina()
      expect(screen.queryByText(/se precargaron|se precargó/i)).toBeNull()
      expect(screen.queryByLabelText("Repuesto 2: descripción")).toBeNull()
      expect(valorDe("Repuesto 1: descripción")).toBe("")
    })

    it("ignora un state que no trae repuestos válidos", () => {
      renderPagina({ pathname: "/portal/solicitud", state: { repuestos: "hola" }, key: "k1" })
      expect(screen.queryByText(/se precargaron|se precargó/i)).toBeNull()
      expect(valorDe("Repuesto 1: descripción")).toBe("")
    })

    it("envía lo precargado sin volver a subir la foto que ya estaba cargada", async () => {
      const subir = vi.spyOn(portalApi, "subirFotoSolicitud")
      const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue(CREADA)
      renderPagina(desdeCarrito())

      enviar()

      await waitFor(() => expect(crear).toHaveBeenCalled())
      expect(subir).not.toHaveBeenCalled()
      expect(crear.mock.calls[0][0].items).toEqual([
        { descripcion: "Filtro de combustible", cantidad: 3, unidad: "UND", marcaTexto: "Caterpillar", numeroParte: "1R-0750" },
        { descripcion: "Pieza sin código", cantidad: 1, unidad: "UND", urlFoto: "https://res.cloudinary.com/x/pieza.jpg" },
      ])
    })

    it("al recargar la misma navegación gana el borrador, con lo que el cliente ya editó", () => {
      const primera = renderPagina(desdeCarrito("k1"))
      llenarRepuesto(1, { descripcion: "Filtro editado" })
      primera.unmount()

      renderPagina(desdeCarrito("k1"))

      expect(valorDe("Repuesto 1: descripción")).toBe("Filtro editado")
      expect(screen.getByText(/se precargaron 2 repuestos/i)).toBeTruthy()
    })

    it("una navegación nueva desde el carrito gana sobre un borrador viejo", () => {
      const primera = renderPagina(desdeCarrito("k1"))
      llenarRepuesto(1, { descripcion: "Filtro editado" })
      primera.unmount()

      renderPagina(desdeCarrito("k2"))

      expect(valorDe("Repuesto 1: descripción")).toBe("Filtro de combustible")
    })
  })
})
