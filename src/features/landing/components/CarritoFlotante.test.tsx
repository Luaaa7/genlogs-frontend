import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import { abrirCarrito, agregarAlCarrito, cerrarCarrito, leerCarrito } from "@/lib/carritoPublico"
import { cerrarSesionCliente, iniciarSesionCliente } from "@/lib/sesiones"
import { CarritoFlotante } from "./CarritoFlotante"

const filtro = { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" }
const rodamiento = { id: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS" }

function Ruta() {
  const { pathname, search } = useLocation()
  return <p>ruta {pathname}{search}</p>
}

function pintar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<CarritoFlotante />} />
        <Route path="*" element={<Ruta />} />
      </Routes>
    </MemoryRouter>,
  )
}

const barra = () => screen.getByRole("button", { name: /tu cotización/i })

describe("CarritoFlotante (landing)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    cerrarSesionCliente()
    cerrarCarrito()
  })

  it("con el carrito vacío no se ve nada", () => {
    pintar()
    expect(screen.queryByRole("button", { name: /tu cotización/i })).toBeNull()
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()
  })

  it("con al menos un repuesto muestra una barra con el conteo", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    pintar()

    expect(barra().textContent).toMatch(/2/)
    expect(barra().getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()
  })

  it("la barra abre el panel con los repuestos elegidos y se cierra con el botón o con Escape", () => {
    agregarAlCarrito({ ...filtro, cantidad: 3 })
    pintar()

    fireEvent.click(barra())
    const panel = screen.getByRole("region", { name: /carrito de cotización/i })
    expect(within(panel).getByText("Filtro de combustible")).toBeTruthy()
    expect(within(panel).getByText("1R-0750")).toBeTruthy()
    expect((within(panel).getByLabelText("Cantidad de Filtro de combustible") as HTMLInputElement).value).toBe("3")

    fireEvent.click(within(panel).getByRole("button", { name: "Cerrar carrito" }))
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()

    fireEvent.click(barra())
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()
  })

  it("se abre solo cuando otra parte de la página lo pide (botón de la cabecera)", () => {
    agregarAlCarrito(filtro)
    pintar()

    act(() => abrirCarrito())

    expect(screen.getByRole("region", { name: /carrito de cotización/i })).toBeTruthy()
  })

  it("permite ajustar la cantidad", () => {
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    fireEvent.change(screen.getByLabelText("Cantidad de Filtro de combustible"), { target: { value: "5" } })
    expect(leerCarrito()[0].cantidad).toBe(5)
  })

  it("el campo de cantidad se puede vaciar para escribir otro número; el mínimo 1 se aplica al salir", () => {
    agregarAlCarrito({ ...filtro, cantidad: 4 })
    pintar()
    fireEvent.click(barra())
    const cantidad = screen.getByLabelText("Cantidad de Filtro de combustible") as HTMLInputElement

    fireEvent.change(cantidad, { target: { value: "" } })
    expect(cantidad.value).toBe("")
    expect(leerCarrito()[0].cantidad).toBe(4)

    fireEvent.change(cantidad, { target: { value: "12" } })
    fireEvent.blur(cantidad)
    expect(cantidad.value).toBe("12")
    expect(leerCarrito()[0].cantidad).toBe(12)
  })

  it.each([[""], ["0"]])("al salir del campo con %j la cantidad vuelve a 1", (escrito) => {
    agregarAlCarrito({ ...filtro, cantidad: 4 })
    pintar()
    fireEvent.click(barra())
    const cantidad = screen.getByLabelText("Cantidad de Filtro de combustible") as HTMLInputElement

    fireEvent.change(cantidad, { target: { value: escrito } })
    fireEvent.blur(cantidad)

    expect(cantidad.value).toBe("1")
    expect(leerCarrito()[0].cantidad).toBe(1)
  })

  it("el botón flotante es más grande: px-6 py-3.5 text-base font-semibold shadow-xl", () => {
    agregarAlCarrito(filtro)
    pintar()
    const clases = barra().className.split(" ")
    for (const c of ["px-6", "py-3.5", "text-base", "font-semibold", "shadow-xl"]) expect(clases).toContain(c)
    expect(barra().querySelector("svg")?.getAttribute("class")).toContain("h-5 w-5")
  })

  it("«Vaciar» limpia toda la lista en un clic y cierra el panel", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    pintar()
    fireEvent.click(barra())

    fireEvent.click(screen.getByRole("button", { name: "Vaciar" }))

    expect(leerCarrito()).toEqual([])
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /tu cotización/i })).toBeNull()
  })

  it("la lista tiene altura máxima con scroll interno para que el botón de solicitar no se salga", () => {
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    const lista = screen.getByRole("list")
    expect(lista.className).toContain("max-h-72")
    expect(lista.className).toContain("overflow-y-auto")
  })

  it("muestra la miniatura de 40x40 junto al nombre cuando el repuesto trae foto", () => {
    agregarAlCarrito({ ...filtro, imagenUrl: "https://ejemplo.test/filtro.jpg" })
    pintar()
    fireEvent.click(barra())

    const foto = document.querySelector("img") as HTMLImageElement
    expect(foto.getAttribute("src")).toBe("https://ejemplo.test/filtro.jpg")
    expect(foto.className).toContain("h-10")
    expect(foto.className).toContain("w-10")
    expect(foto.className).toContain("rounded-lg")
    expect(foto.className).toContain("object-cover")
    expect(screen.queryByTestId("miniatura-respaldo")).toBeNull()
  })

  it("sin foto muestra el recuadro de respaldo con el icono de repuesto", () => {
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    expect(document.querySelector("img")).toBeNull()
    const respaldo = screen.getByTestId("miniatura-respaldo")
    expect(respaldo.className).toContain("h-10")
    expect(respaldo.className).toContain("rounded-lg")
    expect(respaldo.querySelector("svg")).toBeTruthy()
  })

  it("si la foto falla al cargar, pasa al recuadro de respaldo", () => {
    agregarAlCarrito({ ...filtro, imagenUrl: "https://ejemplo.test/rota.jpg" })
    pintar()
    fireEvent.click(barra())

    fireEvent.error(document.querySelector("img") as HTMLImageElement)

    expect(document.querySelector("img")).toBeNull()
    expect(screen.getByTestId("miniatura-respaldo")).toBeTruthy()
  })

  it("permite quitar un repuesto; al quitar el último el carrito desaparece", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    pintar()
    fireEvent.click(barra())

    fireEvent.click(screen.getByRole("button", { name: "Quitar Filtro de combustible" }))
    expect(screen.queryByText("Filtro de combustible")).toBeNull()
    expect(screen.getByText("Rodamiento 6205")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Quitar Rodamiento 6205" }))
    expect(screen.queryByRole("region", { name: /carrito de cotización/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /tu cotización/i })).toBeNull()
  })

  it("el botón dice cuántos repuestos se solicitan", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    pintar()
    fireEvent.click(barra())

    expect(screen.getByRole("button", { name: "Solicitar cotización (2)" })).toBeTruthy()
  })

  it("sin sesión de cliente guarda el regreso y manda a /portal/ingreso", () => {
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    fireEvent.click(screen.getByRole("button", { name: "Solicitar cotización (1)" }))

    expect(screen.getByText("ruta /portal/ingreso?volver=%2Fportal%2Fsolicitud")).toBeTruthy()
    expect(leerCarrito()).toHaveLength(1)
  })

  it("con sesión de cliente va directo a /portal/solicitud", () => {
    iniciarSesionCliente("tok", "Minera")
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    fireEvent.click(screen.getByRole("button", { name: "Solicitar cotización (1)" }))

    expect(screen.getByText("ruta /portal/solicitud")).toBeTruthy()
  })

  it("con una sesión del personal abierta, el carrito no se usa: lo manda a ingresar como cliente", () => {
    localStorage.setItem("access_token", "tok-interno")
    agregarAlCarrito(filtro)
    pintar()
    fireEvent.click(barra())

    fireEvent.click(screen.getByRole("button", { name: "Solicitar cotización (1)" }))

    expect(screen.getByText("ruta /portal/ingreso?volver=%2Fportal%2Fsolicitud")).toBeTruthy()
  })
})
