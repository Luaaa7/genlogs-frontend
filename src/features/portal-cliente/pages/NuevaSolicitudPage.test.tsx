import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { NuevaSolicitudPage } from "./NuevaSolicitudPage"

function renderPagina() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/portal/solicitud"]}>
        <Routes>
          <Route path="/portal/solicitud" element={<NuevaSolicitudPage />} />
          <Route path="/portal/pedidos" element={<div>Mis pedidos</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function llenarGeneral() {
  fireEvent.change(screen.getByLabelText("Asunto"), { target: { value: "Filtros para cargador" } })
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
  for (const [campo, valor] of Object.entries(datos)) {
    fireEvent.change(screen.getByLabelText(campos[campo]), { target: { value: valor } })
  }
}

describe("NuevaSolicitudPage (D-01)", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("envía marca, N.º de parte y GTIN de cada repuesto y vuelve a Mis pedidos", async () => {
    const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue({ idSolicitud: 10, codigoSolicitud: "SOL-10", estado: "PENDIENTE" })
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Filtro de aceite", cantidad: "2", marca: "Caterpillar", numeroParte: "1R-0750", gtin: "7750182002011" })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

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

  it("sin N.º de parte ni foto muestra el error y no envía", () => {
    const crear = vi.spyOn(portalApi, "crearSolicitud")
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Pieza rota del chancador" })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

    expect(screen.getByText("Sin N.º de parte, adjunta una foto o plano del repuesto")).toBeTruthy()
    expect(crear).not.toHaveBeenCalled()
  })

  it("sube la foto primero y manda su URL en el repuesto", async () => {
    const subir = vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
    const crear = vi.spyOn(portalApi, "crearSolicitud").mockResolvedValue({ idSolicitud: 11, codigoSolicitud: "SOL-11", estado: "PENDIENTE" })
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Pieza rota del chancador" })
    const foto = new File(["x"], "pieza.jpg", { type: "image/jpeg" })
    fireEvent.change(screen.getByLabelText("Repuesto 1: foto o plano"), { target: { files: [foto] } })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

    await waitFor(() => expect(crear).toHaveBeenCalled())
    expect(subir).toHaveBeenCalledWith(foto)
    expect(crear.mock.calls[0][0].items?.[0]).toMatchObject({ urlFoto: "https://res.cloudinary.com/x/pieza.jpg" })
    expect(crear.mock.calls[0][0].items[0].numeroParte).toBeUndefined()
  })

  it("permite agregar y quitar repuestos", () => {
    renderPagina()
    expect(screen.queryByRole("button", { name: "Quitar repuesto 1" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Agregar otro repuesto" }))
    expect(screen.getByLabelText("Repuesto 2: descripción")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Quitar repuesto 2" }))
    expect(screen.queryByLabelText("Repuesto 2: descripción")).toBeNull()
  })

  it("si falla la subida de la foto avisa y no crea la solicitud", async () => {
    vi.spyOn(portalApi, "subirFotoSolicitud").mockRejectedValue(new Error("red"))
    const crear = vi.spyOn(portalApi, "crearSolicitud")
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Pieza rota" })
    fireEvent.change(screen.getByLabelText("Repuesto 1: foto o plano"), {
      target: { files: [new File(["x"], "pieza.png", { type: "image/png" })] },
    })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

    expect(await screen.findByText(/no se pudo subir la foto/i)).toBeTruthy()
    expect(crear).not.toHaveBeenCalled()
  })

  it("al quitar un repuesto, el que queda no hereda la foto del borrado", () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText("Repuesto 1: foto o plano"), {
      target: { files: [new File(["x"], "del-primero.jpg", { type: "image/jpeg" })] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Agregar otro repuesto" }))
    fireEvent.change(screen.getByLabelText("Repuesto 2: descripción"), { target: { value: "Segundo" } })

    fireEvent.click(screen.getByRole("button", { name: "Quitar repuesto 1" }))

    expect((screen.getByLabelText("Repuesto 1: descripción") as HTMLInputElement).value).toBe("Segundo")
    expect((screen.getByLabelText("Repuesto 1: foto o plano") as HTMLInputElement).files?.length ?? 0).toBe(0)
  })

  it("si falla crear la solicitud, al reintentar no vuelve a subir la misma foto", async () => {
    const subir = vi.spyOn(portalApi, "subirFotoSolicitud").mockResolvedValue("https://res.cloudinary.com/x/pieza.jpg")
    const crear = vi.spyOn(portalApi, "crearSolicitud").mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce({ idSolicitud: 12, codigoSolicitud: "SOL-12", estado: "PENDIENTE" })
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Pieza rota" })
    fireEvent.change(screen.getByLabelText("Repuesto 1: foto o plano"), {
      target: { files: [new File(["x"], "pieza.jpg", { type: "image/jpeg" })] },
    })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))
    await screen.findByText(/no se pudo enviar la solicitud/i)
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

    await waitFor(() => expect(crear).toHaveBeenCalledTimes(2))
    expect(subir).toHaveBeenCalledTimes(1)
  })

  it("los errores quedan unidos a su campo para lectores de pantalla", () => {
    renderPagina()
    llenarGeneral()
    llenarRepuesto(1, { descripcion: "Filtro", numeroParte: "1R-0750", marca: "" })

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }))

    const marca = screen.getByLabelText("Repuesto 1: marca")
    expect(marca.getAttribute("aria-invalid")).toBe("true")
    const error = document.getElementById(marca.getAttribute("aria-describedby") ?? "")
    expect(error?.textContent).toMatch(/marca/i)
  })
})
