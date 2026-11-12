import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const api = vi.hoisted(() => ({
  buscar: vi.fn(),
  historial: vi.fn(),
  cambiarEstado: vi.fn(),
  leerUrl: vi.fn(),
  guardarUrl: vi.fn(),
  tipoCambioDelDia: vi.fn(),
}))
vi.mock("@/api/sourcingApi", () => ({ sourcingApi: api }))

import { PegarUrlModal } from "./PegarUrlModal"

const leidaOk = {
  url: "https://www.tienda.com/p/6205",
  fuente: "PROVEEDOR",
  titulo: "Rodamiento SKF 6205",
  precio: 100,
  codigoMoneda: "USD",
  urlImagen: null,
  bloqueada: false,
  motivo: null,
}

function pintar(onCerrar = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <PegarUrlModal numeroParte="6205-2RS" marca="SKF" onCerrar={onCerrar} />
    </QueryClientProvider>,
  )
  return onCerrar
}

function leer(url: string) {
  fireEvent.change(screen.getByLabelText(/url del producto/i), { target: { value: url } })
  fireEvent.click(screen.getByRole("button", { name: /leer página/i }))
}

describe("PegarUrlModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Por defecto el endpoint del tipo de cambio aún no existe: se escribe a mano.
    api.tipoCambioDelDia.mockRejectedValue(new Error("404"))
  })

  it("no lee direcciones que no son http", () => {
    pintar()
    leer("www.tienda.com/p/1")
    expect(screen.getByText(/empiece con http/i)).toBeTruthy()
    expect(api.leerUrl).not.toHaveBeenCalled()
  })

  it("prellena lo leído, calcula el costo puesto en Lima y guarda", async () => {
    api.leerUrl.mockResolvedValue(leidaOk)
    api.guardarUrl.mockResolvedValue({ idSourcing: 9, numeroParte: "6205-2RS" })
    const onCerrar = pintar()

    leer("https://www.tienda.com/p/6205")
    expect(await screen.findByDisplayValue("Rodamiento SKF 6205")).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3.75" } })
    fireEvent.change(screen.getByLabelText(/flete/i), { target: { value: "50" } })
    fireEvent.change(screen.getByLabelText(/seguro/i), { target: { value: "10" } })
    fireEvent.change(screen.getByLabelText(/aduana/i), { target: { value: "20" } })
    expect(await screen.findByText(/455\.00/)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    await waitFor(() => expect(api.guardarUrl).toHaveBeenCalled())
    expect(api.guardarUrl.mock.calls[0][0]).toMatchObject({
      url: "https://www.tienda.com/p/6205",
      titulo: "Rodamiento SKF 6205",
      numeroParte: "6205-2RS",
      marca: "SKF",
      precio: 100,
      codigoMoneda: "USD",
      tipoCambio: 3.75,
      flete: 50,
      origen: "IMPORTADO",
      editadoAMano: false,
    })
    await waitFor(() => expect(onCerrar).toHaveBeenCalled())
  })

  it("en dólares exige el tipo de cambio", async () => {
    api.leerUrl.mockResolvedValue(leidaOk)
    pintar()
    leer("https://www.tienda.com/p/6205")
    await screen.findByDisplayValue("Rodamiento SKF 6205")

    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    expect(await screen.findByText(/escribe el tipo de cambio del día/i)).toBeTruthy()
    expect(api.guardarUrl).not.toHaveBeenCalled()
  })

  it("si la tienda bloquea, avisa y se guarda como editada a mano", async () => {
    api.leerUrl.mockResolvedValue({
      ...leidaOk, url: "https://www.amazon.com/dp/X", fuente: "AMAZON", titulo: null, precio: null,
      codigoMoneda: null, bloqueada: true, motivo: "La tienda no permitió leer la página (HTTP 503). Completa los datos a mano.",
    })
    api.guardarUrl.mockResolvedValue({ idSourcing: 10 })
    pintar()

    leer("https://www.amazon.com/dp/X")
    expect(await screen.findByText(/http 503/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    expect(await screen.findByText(/escribe el título/i)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/^título/i), { target: { value: "Filtro CAT" } })
    fireEvent.change(screen.getByLabelText(/precio en la tienda/i), { target: { value: "40" } })
    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3.7" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))

    await waitFor(() => expect(api.guardarUrl).toHaveBeenCalled())
    expect(api.guardarUrl.mock.calls[0][0]).toMatchObject({ titulo: "Filtro CAT", precio: 40, editadoAMano: true })
  })

  it("si la página está en otra moneda (EUR), avisa, deja el precio vacío y se guarda como editada a mano", async () => {
    api.leerUrl.mockResolvedValue({ ...leidaOk, precio: 90, codigoMoneda: "EUR" })
    api.guardarUrl.mockResolvedValue({ idSourcing: 11 })
    pintar()
    leer("https://www.tienda.com/p/6205")

    expect(await screen.findByText(/la página está en eur/i)).toBeTruthy()
    expect((screen.getByLabelText(/precio en la tienda/i) as HTMLInputElement).value).toBe("")

    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    expect(await screen.findByText(/escribe el precio$/i)).toBeTruthy()
    expect(api.guardarUrl).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/precio en la tienda/i), { target: { value: "97,20" } })
    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3,75" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    await waitFor(() => expect(api.guardarUrl).toHaveBeenCalled())
    expect(api.guardarUrl.mock.calls[0][0]).toMatchObject({ precio: 97.2, codigoMoneda: "USD", tipoCambio: 3.75, editadoAMano: true })
  })

  it("acepta la coma decimal en el precio", async () => {
    api.leerUrl.mockResolvedValue({ ...leidaOk, precio: null, codigoMoneda: "PEN" })
    api.guardarUrl.mockResolvedValue({ idSourcing: 12 })
    pintar()
    leer("https://www.tienda.com/p/6205")
    await screen.findByDisplayValue("Rodamiento SKF 6205")

    fireEvent.change(screen.getByLabelText(/precio en la tienda/i), { target: { value: "18,50" } })
    expect(await screen.findByText(/18\.50/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    await waitFor(() => expect(api.guardarUrl).toHaveBeenCalled())
    expect(api.guardarUrl.mock.calls[0][0]).toMatchObject({ precio: 18.5, codigoMoneda: "PEN" })
  })

  it("no acepta una URL de imagen que no sea http(s)", async () => {
    api.leerUrl.mockResolvedValue(leidaOk)
    pintar()
    leer("https://www.tienda.com/p/6205")
    await screen.findByDisplayValue("Rodamiento SKF 6205")

    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3.75" } })
    fireEvent.change(screen.getByLabelText(/url de la imagen/i), { target: { value: "javascript:alert(1)" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    expect(await screen.findByText(/la url de la imagen debe empezar con http/i)).toBeTruthy()
    expect(api.guardarUrl).not.toHaveBeenCalled()
  })

  it("prellena el tipo de cambio del día cuando el endpoint existe", async () => {
    api.tipoCambioDelDia.mockResolvedValue({ fecha: "2026-11-11", codigoMoneda: "USD", valor: 3.79, fuente: "SUNAT", esDeHoy: true })
    api.leerUrl.mockResolvedValue(leidaOk)
    pintar()
    await waitFor(() => expect(api.tipoCambioDelDia).toHaveBeenCalled())
    leer("https://www.tienda.com/p/6205")

    expect(((await screen.findByLabelText(/tipo de cambio/i)) as HTMLInputElement).value).toBe("3.79")
    expect(screen.getByText(/del día: 3\.79 \(sunat\)/i)).toBeTruthy()
  })

  it("el tipo de cambio «3,751» es 3.751, no 3751 (costo correcto)", async () => {
    api.leerUrl.mockResolvedValue(leidaOk) // 100 USD
    api.guardarUrl.mockResolvedValue({ idSourcing: 13 })
    pintar()
    leer("https://www.tienda.com/p/6205")
    await screen.findByDisplayValue("Rodamiento SKF 6205")

    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3,751" } })
    expect(await screen.findByText(/375\.10/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    await waitFor(() => expect(api.guardarUrl).toHaveBeenCalled())
    expect(api.guardarUrl.mock.calls[0][0]).toMatchObject({ tipoCambio: 3.751 })
  })

  it("un tipo de cambio fuera de 1 a 10 se rechaza", async () => {
    api.leerUrl.mockResolvedValue(leidaOk)
    pintar()
    leer("https://www.tienda.com/p/6205")
    await screen.findByDisplayValue("Rodamiento SKF 6205")

    fireEvent.change(screen.getByLabelText(/tipo de cambio/i), { target: { value: "3751" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar referencia/i }))
    expect(await screen.findByText(/debe estar entre 1 y 10/i)).toBeTruthy()
    expect(api.guardarUrl).not.toHaveBeenCalled()
  })
})
