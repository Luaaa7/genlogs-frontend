import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { CompletarEmpresaPage } from "./CompletarEmpresaPage"
import { completarEmpresa } from "../api/ingresoGoogleApi"
import { iniciarSesionCliente, leerSesionCliente } from "@/lib/sesiones"
import { publicApi } from "@/api/publicApi"

vi.mock("../api/ingresoGoogleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/ingresoGoogleApi")>()
  return { ...original, completarEmpresa: vi.fn() }
})

vi.mock("@/api/publicApi", () => ({ publicApi: { consultarRazonSocial: vi.fn() } }))

function renderPagina(ruta = "/portal/empresa?volver=%2Fportal%2Fsolicitud") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/portal/empresa" element={<CompletarEmpresaPage />} />
        <Route path="/portal/solicitud" element={<div>Nueva solicitud</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function llenar(ruc = "20123456789") {
  fireEvent.change(screen.getByLabelText("RUC"), { target: { value: ruc } })
  fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera Sol S.A.C." } })
  fireEvent.change(screen.getByLabelText("Nombres de contacto *"), { target: { value: "Gina" } })
  fireEvent.change(screen.getByLabelText("Apellidos de contacto *"), { target: { value: "Paz" } })
  fireEvent.change(screen.getByLabelText("Teléfono (opcional)"), { target: { value: "999111222" } })
}

describe("CompletarEmpresaPage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(completarEmpresa).mockReset()
    vi.mocked(publicApi.consultarRazonSocial).mockReset()
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "sinDato" })
    iniciarSesionCliente("tok", "Gina", false)
  })

  it("explica por qué se piden los datos", () => {
    renderPagina()
    expect(screen.getByRole("heading", { name: "Datos de tu empresa" })).toBeTruthy()
    expect(screen.getByText(/antes de tu primera cotización/i)).toBeTruthy()
  })

  it("empresa nueva: guarda los datos y sigue a la solicitud", async () => {
    vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "Listo" })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
    expect(completarEmpresa).toHaveBeenCalledWith({
      ruc: "20123456789", razonSocial: "Minera Sol S.A.C.", nombreContacto: "Gina Paz", telefono: "999111222",
    })
    expect(leerSesionCliente()).toEqual({ nombre: "Gina Paz", rol: "CLIENTE", perfilCompleto: true })
  })

  it("empresa que ya es cliente: cierra la sesión y avisa que el acceso está pendiente", async () => {
    vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: true, mensaje: "Tu acceso quedó pendiente." })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("Tu acceso quedó pendiente.")).toBeTruthy()
    expect(localStorage.getItem("cliente_access_token")).toBeNull()
    expect(screen.queryByRole("button", { name: "Guardar y continuar" })).toBeNull()
  })

  it("RUC que no es de 11 dígitos con 10 o 20: avisa sin llamar al servidor", () => {
    renderPagina()
    llenar("12345678")
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(screen.getByText(/11 dígitos/)).toBeTruthy()
    expect(completarEmpresa).not.toHaveBeenCalled()
  })

  it("error del servidor: muestra su mensaje y deja reintentar", async () => {
    vi.mocked(completarEmpresa).mockRejectedValue({
      response: { status: 400, data: { message: "No pudimos validar tu RUC en SUNAT." } },
    })
    renderPagina()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

    expect(await screen.findByText("No pudimos validar tu RUC en SUNAT.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Guardar y continuar" })).toBeTruthy()
  })

  it("con un RUC válido completa la razón social con SUNAT y sigue editable", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "MINERA SOL S.A.C." })
    renderPagina()
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })

    await vi.waitFor(() => expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("MINERA SOL S.A.C."))
    expect(publicApi.consultarRazonSocial).toHaveBeenCalledWith("20123456789", expect.anything())
    expect(screen.getByText(/completada con SUNAT/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Minera Sol" } })
    expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("Minera Sol")
  })

  it("no pisa la razón social escrita a mano ni consulta un RUC incompleto", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "DE SUNAT" })
    renderPagina()
    fireEvent.change(screen.getByLabelText("Razón social"), { target: { value: "Escrita a mano" } })
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "2012345" } })
    expect(publicApi.consultarRazonSocial).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    await vi.waitFor(() => expect(publicApi.consultarRazonSocial).toHaveBeenCalled())
    expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("Escrita a mano")
  })

  it("muestra en qué paso va: la cuenta ya está hecha y ahora toca la empresa", () => {
    renderPagina()
    const pasos = screen.getByRole("list", { name: "Pasos para tu primera cotización" })
    const items = within(pasos).getAllByRole("listitem")
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining("Tu cuenta"),
      expect.stringContaining("Tu empresa"),
      expect.stringContaining("Tu solicitud"),
    ])
    expect(items[0].textContent).toContain("Listo")
    expect(items[1].getAttribute("aria-current")).toBe("step")
  })

  it("el resumen de la empresa espera el RUC y luego muestra lo que trajo SUNAT", async () => {
    vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "MINERA SOL S.A.C." })
    renderPagina()
    const resumen = screen.getByRole("complementary", { name: "Resumen de tu empresa" })
    expect(within(resumen).getByText("Escribe tu RUC")).toBeTruthy()

    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    expect(screen.getByText("Buscando…")).toBeTruthy()

    expect(await screen.findByText("Encontrado en SUNAT")).toBeTruthy()
    expect(within(resumen).getByText("MINERA SOL S.A.C.")).toBeTruthy()
    expect(within(resumen).getByText("RUC 20123456789")).toBeTruthy()
  })

  it("si SUNAT no responde, avisa que la escriba a mano sin marcar el RUC como encontrado", async () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
    expect(await screen.findByText(/escríbela a mano/)).toBeTruthy()
    expect(screen.queryByText("Encontrado en SUNAT")).toBeNull()
    expect(screen.queryByText("Buscando…")).toBeNull()
  })

  it("si guardar tarda (servidor activándose), avisa que espere sin cerrar la página", () => {
    vi.mocked(completarEmpresa).mockReturnValue(new Promise(() => {}))
    renderPagina()
    llenar()
    vi.useFakeTimers()
    try {
      fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))
      expect(screen.queryByText("Esto está tardando más de lo normal")).toBeNull()
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.getByText("Esto está tardando más de lo normal")).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  describe("consulta automática del RUC", () => {
    it("no consulta SUNAT hasta completar los 11 dígitos y consulta una sola vez al llegar al último", async () => {
      renderPagina()
      const ruc = screen.getByLabelText("RUC")
      for (const parcial of ["2", "20", "2012345678"]) fireEvent.change(ruc, { target: { value: parcial } })
      expect(publicApi.consultarRazonSocial).not.toHaveBeenCalled()

      fireEvent.change(ruc, { target: { value: "20123456789" } })
      await vi.waitFor(() => expect(publicApi.consultarRazonSocial).toHaveBeenCalledTimes(1))
      expect(publicApi.consultarRazonSocial).toHaveBeenCalledWith("20123456789", expect.anything())
    })

    it("también consulta un RUC que empieza con 10 (persona con negocio)", async () => {
      renderPagina()
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "10456789012" } })
      await vi.waitFor(() => expect(publicApi.consultarRazonSocial).toHaveBeenCalledWith("10456789012", expect.anything()))
    })

    it("un número de 11 dígitos que no empieza con 10 o 20 no se consulta", () => {
      renderPagina()
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "30123456789" } })
      expect(publicApi.consultarRazonSocial).not.toHaveBeenCalled()
    })

    it("completa la razón social y la tarjeta de la derecha sin pulsar nada más", async () => {
      vi.mocked(publicApi.consultarRazonSocial).mockResolvedValue({ tipo: "ok", razonSocial: "MINERA SOL S.A.C." })
      renderPagina()
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })

      await vi.waitFor(() => expect((screen.getByLabelText("Razón social") as HTMLInputElement).value).toBe("MINERA SOL S.A.C."))
      const resumen = screen.getByRole("complementary", { name: "Resumen de tu empresa" })
      expect(within(resumen).getByText("MINERA SOL S.A.C.")).toBeTruthy()
      expect(within(resumen).getByText("RUC 20123456789")).toBeTruthy()
    })

    it("si el servicio falla, la razón social queda editable y se puede escribir a mano", async () => {
      vi.mocked(publicApi.consultarRazonSocial).mockRejectedValue(new Error("sin servicio"))
      renderPagina()
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })

      expect(await screen.findByText(/escríbela a mano/)).toBeTruthy()
      const razon = screen.getByLabelText("Razón social") as HTMLInputElement
      expect(razon.readOnly).toBe(false)
      expect(razon.disabled).toBe(false)
      fireEvent.change(razon, { target: { value: "Minera Sol" } })
      expect(razon.value).toBe("Minera Sol")
      const resumen = screen.getByRole("complementary", { name: "Resumen de tu empresa" })
      expect(within(resumen).getByText("Minera Sol")).toBeTruthy()
    })
  })

  describe("datos fiscales y datos de contacto separados", () => {
    it("RUC: la identificación fiscal agrupa tipo, RUC y razón social, y el contacto va aparte", () => {
      renderPagina()
      const fiscal = screen.getByRole("region", { name: "Identificación fiscal" })
      expect(within(fiscal).getByLabelText("Empresa (RUC)")).toBeTruthy()
      expect(within(fiscal).getByLabelText("Persona natural (DNI)")).toBeTruthy()
      expect(within(fiscal).getByLabelText("RUC")).toBeTruthy()
      expect(within(fiscal).getByLabelText("Razón social")).toBeTruthy()
      expect(within(fiscal).queryByLabelText("Nombres de contacto *")).toBeNull()
      expect(within(fiscal).queryByLabelText("Nombres *")).toBeNull()

      const contacto = screen.getByRole("region", { name: "Contacto para tus cotizaciones" })
      expect(within(contacto).getByLabelText("Nombres de contacto *")).toBeTruthy()
      expect(within(contacto).getByLabelText("Apellidos de contacto *")).toBeTruthy()
      expect(within(contacto).getByLabelText("Teléfono (opcional)")).toBeTruthy()
      expect(within(contacto).queryByLabelText("RUC")).toBeNull()
      expect(contacto.className).toContain("border-t")
    })

    it("DNI: Nombres y Apellidos van en la identificación y el contacto conserva solo el teléfono", () => {
      renderPagina()
      fireEvent.click(screen.getByLabelText("Persona natural (DNI)"))
      const fiscal = screen.getByRole("region", { name: "Identificación fiscal" })
      expect(within(fiscal).getByLabelText("DNI")).toBeTruthy()
      expect(within(fiscal).queryByLabelText("Razón social")).toBeNull()
      const contacto = screen.getByRole("region", { name: "Contacto para tus cotizaciones" })
      expect(within(fiscal).getByLabelText("Nombres *")).toBeTruthy()
      expect(within(fiscal).getByLabelText("Apellidos *")).toBeTruthy()
      expect(within(contacto).queryByLabelText("Nombres *")).toBeNull()
      expect(within(contacto).queryByLabelText("Nombres de contacto *")).toBeNull()
      expect(within(contacto).getByLabelText("Teléfono (opcional)")).toBeTruthy()
    })
  })

  it("con RUC explica con calma que el acceso es inmediato y que solo se valida el vínculo si la empresa ya tiene cuenta", () => {
    renderPagina()
    expect(
      screen.getByText(
        "Validamos tu RUC en SUNAT con acceso inmediato. Solo si tu empresa ya tiene una cuenta activa en el portal, validaremos tu vínculo por seguridad.",
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/GENLOGS revisará tu acceso/)).toBeNull()
  })

  describe("persona natural (DNI)", () => {
    function elegirDni() {
      fireEvent.click(screen.getByLabelText("Persona natural (DNI)"))
    }

    it("ofrece Empresa (RUC) marcado por defecto y Persona natural (DNI)", () => {
      renderPagina()
      expect((screen.getByLabelText("Empresa (RUC)") as HTMLInputElement).checked).toBe(true)
      expect((screen.getByLabelText("Persona natural (DNI)") as HTMLInputElement).checked).toBe(false)
      expect(screen.getByLabelText("Razón social")).toBeTruthy()
    })

    it("con DNI oculta la razón social, pide 8 dígitos y explica que se emite boleta", () => {
      renderPagina()
      elegirDni()

      expect(screen.queryByLabelText("Razón social")).toBeNull()
      expect((screen.getByLabelText("DNI") as HTMLInputElement).maxLength).toBe(8)
      expect(screen.getByLabelText("Nombres *")).toBeTruthy()
      expect(screen.getByLabelText("Apellidos *")).toBeTruthy()
      expect(screen.getByText("Para compras con DNI emitimos boleta de venta y no se requiere orden de compra.")).toBeTruthy()
      expect(screen.queryByText(/Validamos tu RUC en SUNAT/)).toBeNull()
    })

    it("no consulta SUNAT con un DNI", () => {
      renderPagina()
      elegirDni()
      fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
      expect(publicApi.consultarRazonSocial).not.toHaveBeenCalled()
    })

    it("guarda con tipoDocumento DNI, el número y el nombre, sin razón social", async () => {
      vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "Listo" })
      renderPagina()
      elegirDni()
      fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
      fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "  Rosa  " } })
      fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: " Quispe Mamani " } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

      expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
      expect(completarEmpresa).toHaveBeenCalledWith({
        tipoDocumento: "DNI", ruc: "12345678", nombreContacto: "Rosa Quispe Mamani", telefono: "",
      })
      expect(leerSesionCliente()).toEqual({ nombre: "Rosa Quispe Mamani", rol: "CLIENTE", perfilCompleto: true })
    })

    it("un DNI que no tiene 8 dígitos avisa sin llamar al servidor", () => {
      renderPagina()
      elegirDni()
      fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "1234567" } })
      fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "Quispe" } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

      expect(screen.getByText("El DNI debe tener 8 dígitos.")).toBeTruthy()
      expect(completarEmpresa).not.toHaveBeenCalled()
    })

    it("el resumen muestra el titular y su DNI en cuanto están los 8 dígitos", () => {
      renderPagina()
      elegirDni()
      const resumen = screen.getByRole("complementary", { name: "Resumen de tus datos" })
      expect(within(resumen).getByText("Escribe tu DNI")).toBeTruthy()

      fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
      fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Rosa" } })
      fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "Quispe" } })
      expect(within(resumen).getByText("Rosa Quispe")).toBeTruthy()
      expect(within(resumen).getByText("DNI 12345678")).toBeTruthy()
    })

    it("al cambiar de tipo se limpia el número y volver a RUC trae la razón social", () => {
      renderPagina()
      fireEvent.change(screen.getByLabelText("RUC"), { target: { value: "20123456789" } })
      elegirDni()
      expect((screen.getByLabelText("DNI") as HTMLInputElement).value).toBe("")
      fireEvent.click(screen.getByLabelText("Empresa (RUC)"))
      expect((screen.getByLabelText("RUC") as HTMLInputElement).value).toBe("")
      expect(screen.getByLabelText("Razón social")).toBeTruthy()
    })

    it("si el DNI ya es cliente: cierra la sesión y avisa que el acceso está pendiente", async () => {
      vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: true, mensaje: "Tu acceso quedó pendiente." })
      renderPagina()
      elegirDni()
      fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
      fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Rosa" } })
      fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "Quispe" } })
      fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))

      expect(await screen.findByText("Tu acceso quedó pendiente.")).toBeTruthy()
      expect(localStorage.getItem("cliente_access_token")).toBeNull()
    })

    describe("nombres y apellidos separados", () => {
      function enviarSinValidarNavegador() {
        const formulario = screen.getByRole("button", { name: "Guardar y continuar" }).closest("form") as HTMLFormElement
        fireEvent.submit(formulario)
      }

      it("con la cuenta de Google ya conocida, reparte el nombre en Nombres y Apellidos editables", () => {
        iniciarSesionCliente("tok", "Luana Gabriela Barrientos Espinoza", false)
        renderPagina()
        elegirDni()
        const nombres = screen.getByLabelText("Nombres *") as HTMLInputElement
        const apellidos = screen.getByLabelText("Apellidos *") as HTMLInputElement
        expect(nombres.value).toBe("Luana Gabriela")
        expect(apellidos.value).toBe("Barrientos Espinoza")
        fireEvent.change(nombres, { target: { value: "Luana" } })
        expect(nombres.value).toBe("Luana")
      })

      it("al completar los 8 dígitos con los campos vacíos, los llena con el nombre de la cuenta", () => {
        iniciarSesionCliente("tok", "Rosa Quispe Mamani", false)
        renderPagina()
        elegirDni()
        fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "" } })
        fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "" } })
        fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "1234567" } })
        expect((screen.getByLabelText("Nombres *") as HTMLInputElement).value).toBe("")
        fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
        expect((screen.getByLabelText("Nombres *") as HTMLInputElement).value).toBe("Rosa")
        expect((screen.getByLabelText("Apellidos *") as HTMLInputElement).value).toBe("Quispe Mamani")
      })

      it("no pisa lo que la persona ya escribió al completar los 8 dígitos", () => {
        iniciarSesionCliente("tok", "Rosa Quispe Mamani", false)
        renderPagina()
        elegirDni()
        fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Ana María" } })
        fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
        expect((screen.getByLabelText("Nombres *") as HTMLInputElement).value).toBe("Ana María")
      })

      it("sin Apellidos avisa y no llama al servidor", () => {
        renderPagina()
        elegirDni()
        fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
        fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Rosa" } })
        fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "   " } })
        enviarSinValidarNavegador()
        expect(screen.getByText("Escribe tus nombres y apellidos.")).toBeTruthy()
        expect(completarEmpresa).not.toHaveBeenCalled()
      })

      it("el resumen de la derecha muestra el nombre completo unido", () => {
        renderPagina()
        elegirDni()
        fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "12345678" } })
        fireEvent.change(screen.getByLabelText("Nombres *"), { target: { value: "Rosa Elena" } })
        fireEvent.change(screen.getByLabelText("Apellidos *"), { target: { value: "Quispe Mamani" } })
        const resumen = screen.getByRole("complementary", { name: "Resumen de tus datos" })
        expect(within(resumen).getByText("Rosa Elena Quispe Mamani")).toBeTruthy()
      })

      it("RUC: pide nombres y apellidos de contacto y los envía unidos sin espacios de más", async () => {
        vi.mocked(completarEmpresa).mockResolvedValue({ pendiente: false, mensaje: "Listo" })
        renderPagina()
        llenar()
        fireEvent.change(screen.getByLabelText("Nombres de contacto *"), { target: { value: " Gina  " } })
        fireEvent.change(screen.getByLabelText("Apellidos de contacto *"), { target: { value: "  Paz Soto " } })
        fireEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }))
        expect(await screen.findByText("Nueva solicitud")).toBeTruthy()
        expect(completarEmpresa).toHaveBeenCalledWith(expect.objectContaining({ nombreContacto: "Gina Paz Soto" }))
      })

      it("RUC: sin apellidos de contacto avisa y no llama al servidor", () => {
        renderPagina()
        llenar()
        fireEvent.change(screen.getByLabelText("Apellidos de contacto *"), { target: { value: "" } })
        enviarSinValidarNavegador()
        expect(screen.getByText("Escribe los nombres y apellidos de la persona de contacto.")).toBeTruthy()
        expect(completarEmpresa).not.toHaveBeenCalled()
      })
    })
  })
})
