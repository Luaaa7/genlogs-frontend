import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCobertura } from "../hooks/useCobertura"
import { CoberturaMinera, UNIDADES_INICIALES } from "./CoberturaMinera"

vi.mock("../hooks/useCobertura", () => ({ useCobertura: vi.fn() }))

function zonas(cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => ({ id: i + 1, nombre: `Unidad ${i + 1}`, region: `Región ${i + 1}`, descripcion: null }))
}

function conCobertura(cantidad: number) {
  vi.mocked(useCobertura).mockReturnValue({ data: zonas(cantidad), isPending: false, isError: false, refetch: vi.fn() } as never)
}

/** 11 unidades en 8 departamentos: Arequipa (2), Lima (2), Ica (2) y uno cada Junín, Áncash, Cusco, Pasco. */
const REALES = [
  { id: 1, nombre: "U.M. Cerro Verde", region: "Arequipa", descripcion: null },
  { id: 2, nombre: "U.M. Arcata", region: "Arequipa", descripcion: null },
  { id: 3, nombre: "U.M. Marcona", region: "Ica", descripcion: null },
  { id: 4, nombre: "U.M. Cerro Lindo", region: "Ica", descripcion: null },
  { id: 5, nombre: "U.M. Condestable", region: "Lima", descripcion: null },
  { id: 6, nombre: "U.M. Yauricocha", region: "Lima", descripcion: null },
  { id: 7, nombre: "U.M. Casapalca", region: "Junín", descripcion: null },
  { id: 8, nombre: "U.M. Antamina", region: "Áncash", descripcion: null },
  { id: 9, nombre: "U.M. Antapaccay", region: "Cusco", descripcion: null },
  { id: 10, nombre: "U.M. Cerro de Pasco", region: "Pasco", descripcion: null },
  { id: 11, nombre: "U.M. Sin región", region: null, descripcion: null },
]

function conReales() {
  vi.mocked(useCobertura).mockReturnValue({ data: REALES, isPending: false, isError: false, refetch: vi.fn() } as never)
}

const titulos = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
const trazo = (id: string) => document.querySelector(`[data-departamento="${id}"]`) as SVGPathElement
const etiquetaMapa = () => screen.getByTestId("etiqueta-mapa").textContent
const BOTON_VER = "Ver todas las unidades mineras (11)"

describe("CoberturaMinera (v3.4)", () => {
  beforeEach(() => vi.mocked(useCobertura).mockReset())

  describe("estado inicial", () => {
    it("con más de 6 unidades muestra las 6 destacadas y un botón con el total real", () => {
      conCobertura(9)
      render(<CoberturaMinera />)
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
      expect(screen.queryByText("Unidad 7")).toBeNull()
      const boton = screen.getByRole("button", { name: "Ver todas las unidades mineras (9)" })
      expect(boton.getAttribute("aria-expanded")).toBe("false")
    })

    it("el total del botón sigue a la cantidad real de unidades", () => {
      conCobertura(23)
      render(<CoberturaMinera />)
      expect(screen.getByRole("button", { name: "Ver todas las unidades mineras (23)" })).toBeTruthy()
    })

    it("muestra el mapa a un lado y el buscador con la lista, esta con altura acotada y scroll interno", () => {
      conReales()
      render(<CoberturaMinera />)
      expect(screen.getByRole("group", { name: "Mapa del Perú por departamentos" })).toBeTruthy()
      expect(screen.getByPlaceholderText("Buscar unidad minera o región...")).toBeTruthy()
      const lista = screen.getByRole("region", { name: "Unidades mineras" })
      expect(lista.className).toContain("max-h-96")
      expect(lista.className).toContain("overflow-y-auto")
      expect(lista.className).toContain("scroll-smooth")
      expect(screen.getByRole("status").textContent).toBe("6 de 11 unidades")
    })

    it("con 6 unidades o menos no hay botón pero el mapa y el buscador siguen", () => {
      conCobertura(UNIDADES_INICIALES)
      render(<CoberturaMinera />)
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
      expect(screen.queryByRole("button", { name: /Ver todas/ })).toBeNull()
      expect(screen.getByRole("searchbox")).toBeTruthy()
      expect(screen.getByRole("group", { name: "Mapa del Perú por departamentos" })).toBeTruthy()
    })

    it("sin unidades invita a contactar", () => {
      conCobertura(0)
      render(<CoberturaMinera />)
      expect(screen.getByText(/Contáctanos para conocer nuestra cobertura actual/)).toBeTruthy()
      expect(screen.queryByRole("group", { name: "Mapa del Perú por departamentos" })).toBeNull()
    })
  })

  describe("mapa", () => {
    it("solo los departamentos con unidades son pulsables, con su cantidad", () => {
      conReales()
      render(<CoberturaMinera />)
      expect(screen.getByRole("button", { name: "Arequipa: 2 unidades" })).toBeTruthy()
      expect(screen.getByRole("button", { name: "Áncash: 1 unidad" })).toBeTruthy()
      expect(screen.getAllByRole("button", { name: /: \d+ unidad(es)?$/ })).toHaveLength(7)
      const sinUnidades = trazo("lambayeque")
      expect(sinUnidades.getAttribute("role")).toBeNull()
      expect(sinUnidades.getAttribute("aria-hidden")).toBe("true")
      expect(sinUnidades.getAttribute("class")).toContain("fill-slate-200")
      expect(trazo("arequipa").getAttribute("class")).toContain("fill-primary")
    })

    it("al pasar el cursor muestra una etiqueta con el departamento y su cantidad", () => {
      conReales()
      render(<CoberturaMinera />)
      expect(etiquetaMapa()).toBe("Pasa el cursor sobre un departamento")
      fireEvent.mouseEnter(trazo("arequipa"))
      expect(etiquetaMapa()).toBe("Arequipa: 2 unidades")
      fireEvent.mouseLeave(trazo("arequipa"))
      expect(etiquetaMapa()).toBe("Pasa el cursor sobre un departamento")
      fireEvent.mouseEnter(trazo("lambayeque"))
      expect(etiquetaMapa()).toBe("Lambayeque: sin unidades")
    })

    it("la etiqueta también sale al enfocar con el teclado", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.focus(screen.getByRole("button", { name: "Lima: 2 unidades" }))
      expect(etiquetaMapa()).toBe("Lima: 2 unidades")
    })

    it("pulsar un departamento filtra la lista por esa región y muestra la píldora para quitarlo", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: "Arequipa: 2 unidades" }))

      expect(titulos()).toEqual(["U.M. Cerro Verde", "U.M. Arcata"])
      expect(screen.getByRole("status").textContent).toBe("2 de 11 unidades")
      expect(screen.getByRole("button", { name: "Arequipa: 2 unidades" }).getAttribute("aria-pressed")).toBe("true")
      expect(trazo("arequipa").getAttribute("class")).toContain("fill-accent")
      const pildora = screen.getByRole("button", { name: "Región: Arequipa, quitar filtro" })
      expect(pildora.textContent).toBe("Región: Arequipa")
      expect(screen.getByRole("button", { name: "Mostrar menos" })).toBeTruthy()
    })

    it("la píldora quita el filtro y vuelven las 6 destacadas", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: "Áncash: 1 unidad" }))
      expect(titulos()).toEqual(["U.M. Antamina"])

      fireEvent.click(screen.getByRole("button", { name: "Región: Áncash, quitar filtro" }))
      expect(screen.queryByRole("button", { name: /quitar filtro/ })).toBeNull()
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
      expect(screen.getByRole("button", { name: BOTON_VER })).toBeTruthy()
    })

    it("pulsar otra vez el mismo departamento o elegir otro cambia el filtro", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: "Ica: 2 unidades" }))
      expect(titulos()).toEqual(["U.M. Marcona", "U.M. Cerro Lindo"])
      fireEvent.click(screen.getByRole("button", { name: "Lima: 2 unidades" }))
      expect(titulos()).toEqual(["U.M. Condestable", "U.M. Yauricocha"])
      fireEvent.click(screen.getByRole("button", { name: "Lima: 2 unidades" }))
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
    })

    it("con el teclado, Enter y Espacio eligen el departamento", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.keyDown(screen.getByRole("button", { name: "Cusco: 1 unidad" }), { key: "Enter" })
      expect(titulos()).toEqual(["U.M. Antapaccay"])
      fireEvent.keyDown(screen.getByRole("button", { name: "Cusco: 1 unidad" }), { key: " " })
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
    })
  })

  describe("buscador y botón", () => {
    it("«Ver todas las unidades mineras» muestra todas y «Mostrar menos» vuelve a las 6", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: BOTON_VER }))
      expect(titulos()).toHaveLength(11)
      expect(screen.getByRole("status").textContent).toBe("11 de 11 unidades")
      expect(screen.getByRole("button", { name: "Mostrar menos" }).getAttribute("aria-expanded")).toBe("true")

      fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }))
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
      expect(screen.getByRole("button", { name: BOTON_VER }).getAttribute("aria-expanded")).toBe("false")
    })

    it("filtra en tiempo real por nombre de unidad y por departamento, sin importar tildes ni mayúsculas", () => {
      conReales()
      render(<CoberturaMinera />)
      const buscador = screen.getByRole("searchbox")
      fireEvent.change(buscador, { target: { value: "antamina" } })
      expect(titulos()).toEqual(["U.M. Antamina"])
      fireEvent.change(buscador, { target: { value: "ANCASH" } })
      expect(titulos()).toEqual(["U.M. Antamina"])
      fireEvent.change(buscador, { target: { value: "junin" } })
      expect(titulos()).toEqual(["U.M. Casapalca"])
      expect(screen.getByRole("status").textContent).toBe("1 de 11 unidades")
    })

    it("escribir en el buscador limpia el filtro del mapa", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: "Arequipa: 2 unidades" }))
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "lima" } })

      expect(screen.queryByRole("button", { name: /quitar filtro/ })).toBeNull()
      expect(screen.getByRole("button", { name: "Arequipa: 2 unidades" }).getAttribute("aria-pressed")).toBe("false")
      expect(titulos()).toEqual(["U.M. Condestable", "U.M. Yauricocha"])
    })

    it("elegir un departamento limpia lo que se había escrito", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "cerro" } })
      fireEvent.click(screen.getByRole("button", { name: "Ica: 2 unidades" }))
      expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("")
      expect(titulos()).toEqual(["U.M. Marcona", "U.M. Cerro Lindo"])
    })

    it("«Mostrar menos» limpia la búsqueda y el filtro del mapa de una vez", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: "Arequipa: 2 unidades" }))
      fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }))
      expect(screen.queryByRole("button", { name: /quitar filtro/ })).toBeNull()
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "cerro" } })
      expect(titulos().length).toBeLessThan(UNIDADES_INICIALES)
      fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }))
      expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("")
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
    })

    it("sin coincidencias avisa y no deja una lista vacía; al borrar vuelven las destacadas", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } })
      expect(screen.getByRole("status").textContent).toMatch(/No encontramos unidades/)
      expect(screen.queryByRole("region", { name: "Unidades mineras" })).toBeNull()
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } })
      expect(titulos()).toHaveLength(UNIDADES_INICIALES)
    })

    it("la lista con todas las unidades sigue dentro del contenedor con scroll", () => {
      conReales()
      render(<CoberturaMinera />)
      fireEvent.click(screen.getByRole("button", { name: BOTON_VER }))
      const lista = screen.getByRole("region", { name: "Unidades mineras" })
      expect(within(lista).getAllByRole("heading", { level: 3 })).toHaveLength(11)
    })
  })

  describe("estado de carga", () => {
    function cargando() {
      vi.mocked(useCobertura).mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() } as never)
    }

    it("mientras carga muestra 6 tarjetas fantasma (3 filas de 2) y avisa que está cargando", () => {
      cargando()
      render(<CoberturaMinera />)
      const aviso = screen.getByRole("status", { name: "Cargando cobertura" })
      expect(aviso.getAttribute("aria-busy")).toBe("true")
      expect(within(aviso).getAllByTestId("esqueleto-unidad")).toHaveLength(UNIDADES_INICIALES)
      expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0)
      expect(screen.queryByRole("button", { name: /ver todas las unidades/i })).toBeNull()
    })

    it("el título de la sección sigue visible durante la carga", () => {
      cargando()
      render(<CoberturaMinera />)
      expect(screen.getByRole("heading", { level: 2, name: /llegamos donde tu operación lo necesita/i })).toBeTruthy()
    })

    it("cada tarjeta fantasma usa el mismo molde que la tarjeta real, para que no haya saltos", () => {
      cargando()
      const { rerender } = render(<CoberturaMinera />)
      const fantasma = screen.getAllByTestId("esqueleto-unidad")[0]
      conCobertura(8)
      rerender(<CoberturaMinera />)
      const real = screen.getAllByRole("heading", { level: 3 })[0].closest("article") as HTMLElement
      for (const clase of ["flex", "items-start", "gap-3", "rounded-lg", "border", "px-3", "py-2.5"]) {
        expect(fantasma.className).toContain(clase)
        expect(real.className).toContain(clase)
      }
    })

    it("al resolver los datos desaparecen los fantasmas y aparecen las unidades", () => {
      cargando()
      const { rerender } = render(<CoberturaMinera />)
      expect(screen.getAllByTestId("esqueleto-unidad")).toHaveLength(6)
      conCobertura(9)
      rerender(<CoberturaMinera />)
      expect(screen.queryByTestId("esqueleto-unidad")).toBeNull()
      expect(screen.queryByRole("status", { name: "Cargando cobertura" })).toBeNull()
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    })
  })
})
