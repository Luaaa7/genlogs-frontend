import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { publicApi } from "@/api/publicApi"
import { portalApi } from "@/api/portalApi"
import { RegistroClientePage } from "./RegistroClientePage"

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/portal/registro"]}>
      <RegistroClientePage />
    </MemoryRouter>,
  )
}

function llenarPassword(password: string, confirmacion = password) {
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } })
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: confirmacion } })
}

function botonCrear() {
  return screen.getByRole("button", { name: "Crear acceso" }) as HTMLButtonElement
}

function campo(etiqueta: string) {
  return screen.getByLabelText(etiqueta) as HTMLInputElement
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("RegistroClientePage: RUC → razón social (7.1)", () => {
  it("con un RUC que no empieza con 10 o 20 avisa y no consulta", () => {
    const consulta = vi.spyOn(publicApi, "consultarRazonSocial")
    renderizar()
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "30123456789" } })
    expect(screen.getByText("Ingresa un RUC válido")).toBeTruthy()
    expect(consulta).not.toHaveBeenCalled()
  })

  it("con un RUC válido autocompleta la razón social y sigue editable", async () => {
    vi.spyOn(publicApi, "consultarRazonSocial").mockResolvedValue({ tipo: "ok", razonSocial: "MINERA NUEVA S.A.C." })
    renderizar()
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "20123456789" } })
    const razon = (await screen.findByDisplayValue("MINERA NUEVA S.A.C.")) as HTMLInputElement
    expect(razon.readOnly).toBe(false)
    expect(razon.disabled).toBe(false)
    fireEvent.change(razon, { target: { value: "Minera Nueva" } })
    expect(campo("Razón social").value).toBe("Minera Nueva")
  })

  it("no pisa la razón social que la persona ya escribió", async () => {
    vi.spyOn(publicApi, "consultarRazonSocial").mockResolvedValue({ tipo: "ok", razonSocial: "MINERA NUEVA S.A.C." })
    renderizar()
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Escrita a mano" } })
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "20123456789" } })
    await waitFor(() => expect(publicApi.consultarRazonSocial).toHaveBeenCalledTimes(1))
    expect(campo("Razón social").value).toBe("Escrita a mano")
  })

  it("con 429 pide escribirla a mano, no reintenta y el registro sigue posible", async () => {
    const consulta = vi.spyOn(publicApi, "consultarRazonSocial").mockResolvedValue({ tipo: "limite" })
    renderizar()
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "20123456789" } })
    expect(await screen.findByText("Escribe la razón social a mano")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@portal.pe" } })
    llenarPassword("Clave1234")
    expect(consulta).toHaveBeenCalledTimes(1)
    expect(botonCrear().disabled).toBe(false)
  })

  it("sin dato o con error de red no bloquea el registro", async () => {
    vi.spyOn(publicApi, "consultarRazonSocial").mockResolvedValue({ tipo: "sinDato" })
    renderizar()
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "10123456789" } })
    expect(await screen.findByText("No pudimos obtener la razón social, escríbela a mano")).toBeTruthy()
    llenarPassword("Clave1234")
    expect(botonCrear().disabled).toBe(false)
  })
})

describe("RegistroClientePage: contraseña (7.2)", () => {
  it("el botón de ojo cambia el tipo del campo y su aria-label", () => {
    renderizar()
    const password = campo("Contraseña")
    expect(password.type).toBe("password")
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }))
    expect(password.type).toBe("text")
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toBeTruthy()
  })

  it("con la confirmación distinta desactiva Crear acceso; igual y válida lo activa", () => {
    renderizar()
    llenarPassword("Clave1234", "Clave12345")
    expect(screen.getByText("Las contraseñas no coinciden")).toBeTruthy()
    expect(botonCrear().disabled).toBe(true)
    llenarPassword("Clave1234")
    expect(botonCrear().disabled).toBe(false)
  })

  it("con un 400 por la contraseña muestra el mensaje y limpia los dos campos", async () => {
    vi.spyOn(portalApi, "registrarCliente").mockRejectedValue({
      response: { status: 400, data: { message: "La contraseña debe ser distinta del correo" } },
    })
    renderizar()
    fireEvent.change(screen.getByLabelText("RUC / documento"), { target: { value: "2012345" } })
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera" } })
    fireEvent.change(screen.getByLabelText("Persona de contacto"), { target: { value: "Ana" } })
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@portal.pe" } })
    llenarPassword("Clave1234")
    fireEvent.click(botonCrear())
    expect(await screen.findByText("La contraseña debe ser distinta del correo")).toBeTruthy()
    expect(campo("Contraseña").value).toBe("")
    expect(campo("Confirmar contraseña").value).toBe("")
    expect(campo("Razón social").value).toBe("Minera")
  })
})

describe("RegistroClientePage: tarjeta unificada con el ingreso (v3.4)", () => {
  it("el título va dentro de la misma tarjeta que los campos", () => {
    renderizar()
    const tarjeta = screen.getByTestId("tarjeta-registro")
    expect(tarjeta.contains(screen.getByRole("heading", { name: "Crea tu acceso" }))).toBe(true)
    expect(tarjeta.contains(screen.getByLabelText("RUC / documento"))).toBe(true)
    expect(screen.getByRole("link", { name: "Ingresar al portal" }).getAttribute("href")).toContain("/portal/ingreso")
  })
})
