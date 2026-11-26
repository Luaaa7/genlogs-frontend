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

describe("CoberturaMinera (v3.4)", () => {
  beforeEach(() => vi.mocked(useCobertura).mockReset())

  it("con más de 6 unidades muestra las 6 destacadas y un botón con el total real", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    expect(screen.queryByText("Unidad 7")).toBeNull()
    expect(screen.queryByRole("searchbox")).toBeNull()
    const boton = screen.getByRole("button", { name: "Ver todas las unidades mineras (9)" })
    expect(boton.getAttribute("aria-expanded")).toBe("false")
  })

  it("el total del botón sigue a la cantidad real de unidades", () => {
    conCobertura(23)
    render(<CoberturaMinera />)
    expect(screen.getByRole("button", { name: "Ver todas las unidades mineras (23)" })).toBeTruthy()
  })

  it("al desplegar muestra el buscador y todas las unidades en una lista compacta con scroll interno", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: "Ver todas las unidades mineras (9)" }))

    const buscador = screen.getByPlaceholderText("Buscar unidad minera o región...")
    expect(buscador).toBeTruthy()
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9)
    const lista = screen.getByRole("region", { name: "Todas las unidades mineras" })
    expect(lista.className).toContain("max-h-96")
    expect(lista.className).toContain("overflow-y-auto")
    expect(within(lista).getAllByRole("heading", { level: 3 })).toHaveLength(9)
    expect(screen.getByRole("button", { name: "Mostrar menos" }).getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("status").textContent).toBe("9 de 9 unidades")
  })

  it("el buscador filtra en tiempo real por nombre de unidad", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: /Ver todas las unidades mineras/ }))
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unidad 7" } })

    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Unidad 7"])
    expect(screen.getByRole("status").textContent).toBe("1 de 9 unidades")
  })

  it("el buscador también filtra por departamento y no distingue tildes ni mayúsculas", () => {
    vi.mocked(useCobertura).mockReturnValue({
      data: [
        { id: 1, nombre: "U.M. Cerro Lindo", region: "Ica", descripcion: null },
        { id: 2, nombre: "U.M. Antamina", region: "Áncash", descripcion: null },
        { id: 3, nombre: "U.M. Yauricocha", region: "Lima", descripcion: null },
        { id: 4, nombre: "U.M. Marcona", region: "Ica", descripcion: null },
        { id: 5, nombre: "U.M. Toquepala", region: "Tacna", descripcion: null },
        { id: 6, nombre: "U.M. Cuajone", region: "Moquegua", descripcion: null },
        { id: 7, nombre: "U.M. Condestable", region: "Lima", descripcion: null },
      ],
      isPending: false, isError: false, refetch: vi.fn(),
    } as never)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: /Ver todas las unidades mineras/ }))

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ICA" } })
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["U.M. Cerro Lindo", "U.M. Marcona"])

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ancash" } })
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["U.M. Antamina"])
  })

  it("sin coincidencias avisa y no deja una lista vacía; al borrar la búsqueda vuelven todas", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: /Ver todas las unidades mineras/ }))
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } })

    expect(screen.getByRole("status").textContent).toMatch(/No encontramos unidades/)
    expect(screen.queryByRole("region", { name: "Todas las unidades mineras" })).toBeNull()
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } })
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9)
  })

  it("«Mostrar menos» vuelve a las 6 destacadas, quita el buscador y limpia la búsqueda", () => {
    conCobertura(9)
    render(<CoberturaMinera />)
    fireEvent.click(screen.getByRole("button", { name: /Ver todas las unidades mineras/ }))
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unidad 7" } })
    fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }))

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    expect(screen.queryByRole("searchbox")).toBeNull()
    expect(screen.getByRole("button", { name: "Ver todas las unidades mineras (9)" }).getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(screen.getByRole("button", { name: /Ver todas las unidades mineras/ }))
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("")
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9)
  })

  it("con 6 unidades o menos no hay botón", () => {
    conCobertura(UNIDADES_INICIALES)
    render(<CoberturaMinera />)
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(UNIDADES_INICIALES)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByRole("searchbox")).toBeNull()
  })

  it("sin unidades invita a contactar", () => {
    conCobertura(0)
    render(<CoberturaMinera />)
    expect(screen.getByText(/Contáctanos para conocer nuestra cobertura actual/)).toBeTruthy()
  })
})
