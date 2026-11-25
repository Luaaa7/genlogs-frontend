import { describe, expect, it } from "vitest"
import {
  asuntoAutomatico,
  esGtinValido,
  itemVacio,
  pesoEnMb,
  validarArchivo,
  validarItem,
  type ItemPedidoForm,
} from "./itemPedido"

const base: ItemPedidoForm = {
  id: "item-prueba",
  modo: "parte",
  descripcion: "Filtro de aceite",
  cantidad: "2",
  unidad: "UND",
  marca: "Caterpillar",
  numeroParte: "1R-0750",
  gtin: "",
  foto: null,
  urlFoto: null,
}

const foto = new File(["x"], "placa.jpg", { type: "image/jpeg" })

describe("esGtinValido", () => {
  it("acepta un EAN-13 con dígito verificador correcto", () => {
    expect(esGtinValido("7750182002011")).toBe(true)
  })

  it("acepta GTIN de 8, 12 y 14 dígitos válidos", () => {
    expect(esGtinValido("96385074")).toBe(true)
    expect(esGtinValido("036000291452")).toBe(true)
    expect(esGtinValido("10012345678902")).toBe(true)
  })

  it("rechaza dígito verificador incorrecto, largo inválido o letras", () => {
    expect(esGtinValido("7750182002012")).toBe(false)
    expect(esGtinValido("12345")).toBe(false)
    expect(esGtinValido("77501820020AB")).toBe(false)
  })
})

describe("itemVacio", () => {
  it("empieza en el modo «Tengo el N.º de parte»", () => {
    expect(itemVacio().modo).toBe("parte")
  })
})

describe("validarItem en modo «Tengo el N.º de parte»", () => {
  it("con marca y N.º de parte no pide foto", () => {
    expect(validarItem(base)).toEqual({})
  })

  it("exige el N.º de parte y no acepta la foto en su lugar", () => {
    const errores = validarItem({ ...base, numeroParte: "", marca: "", foto })
    expect(errores.numeroParte).toMatch(/N\.º de parte/)
    expect(errores.foto).toBeUndefined()
  })

  it("pide también la marca del N.º de parte", () => {
    expect(validarItem({ ...base, marca: " " }).marca).toMatch(/marca/i)
  })

  it("la foto o plano es opcional, pero si la adjunta debe ser válida", () => {
    expect(validarItem({ ...base, foto })).toEqual({})
    const exe = new File(["x"], "virus.exe", { type: "application/x-msdownload" })
    expect(validarItem({ ...base, foto: exe }).foto).toMatch(/JPG, PNG, WEBP o PDF/)
  })
})

describe("validarItem en modo «Tengo una foto»", () => {
  const modoFoto: ItemPedidoForm = { ...base, modo: "foto", numeroParte: "", marca: "" }

  it("exige la foto o plano", () => {
    expect(validarItem(modoFoto).foto).toMatch(/foto o plano/i)
    expect(validarItem({ ...modoFoto, foto })).toEqual({})
  })

  it("la marca es opcional y el N.º de parte escondido no se valida", () => {
    const errores = validarItem({ ...modoFoto, foto, numeroParte: "1R-0750", marca: "" })
    expect(errores).toEqual({})
  })

  it("una foto ya subida (por ejemplo, desde el carrito) cuenta como foto", () => {
    expect(validarItem({ ...modoFoto, urlFoto: "https://res.cloudinary.com/x/pieza.jpg" })).toEqual({})
  })
})

describe("validarItem en modo «Es un servicio / fabricación»", () => {
  const servicio: ItemPedidoForm = { ...base, modo: "servicio", unidad: "SERV", numeroParte: "", marca: "" }

  it("solo exige la descripción: sin marca, N.º de parte ni foto", () => {
    expect(validarItem(servicio)).toEqual({})
    expect(validarItem({ ...servicio, descripcion: " " }).descripcion).toBeTruthy()
  })

  it("el plano es opcional, pero si lo adjunta debe ser válido", () => {
    expect(validarItem({ ...servicio, foto })).toEqual({})
    const exe = new File(["x"], "virus.exe", { type: "application/x-msdownload" })
    expect(validarItem({ ...servicio, foto: exe }).foto).toMatch(/JPG, PNG, WEBP o PDF/)
  })
})

describe("validarArchivo", () => {
  it("acepta JPG, PNG, WEBP y PDF de hasta 10 MB", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) {
      expect(validarArchivo(new File(["x"], "a", { type: tipo }))).toBeUndefined()
    }
    const justo = new File([new Uint8Array(10 * 1024 * 1024)], "a.pdf", { type: "application/pdf" })
    expect(validarArchivo(justo)).toBeUndefined()
  })

  it("rechaza otro formato o más de 10 MB", () => {
    expect(validarArchivo(new File(["x"], "a.gif", { type: "image/gif" }))).toMatch(/JPG, PNG, WEBP o PDF/)
    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "a.pdf", { type: "application/pdf" })
    expect(validarArchivo(grande)).toMatch(/10 MB/)
  })
})

describe("pesoEnMb", () => {
  it("da el peso con un decimal y nunca menos de 0.1 MB", () => {
    expect(pesoEnMb(1.5 * 1024 * 1024)).toBe("1.5 MB")
    expect(pesoEnMb(10 * 1024 * 1024)).toBe("10.0 MB")
    expect(pesoEnMb(1)).toBe("0.1 MB")
  })
})

describe("validarItem (reglas comunes)", () => {
  it("exige descripción y cantidad mayor a cero", () => {
    const errores = validarItem({ ...base, descripcion: " ", cantidad: "0" })
    expect(errores.descripcion).toBeTruthy()
    expect(errores.cantidad).toMatch(/mayor a cero/i)
  })

  it("el GTIN es opcional, pero si lo escribe debe ser válido", () => {
    expect(validarItem({ ...base, gtin: "" }).gtin).toBeUndefined()
    expect(validarItem({ ...base, gtin: "123" }).gtin).toMatch(/gtin/i)
  })

  it("solo acepta fotos o planos (JPG, PNG, WEBP o PDF) de hasta 10 MB", () => {
    const exe = new File(["x"], "virus.exe", { type: "application/x-msdownload" })
    expect(validarItem({ ...base, modo: "foto", foto: exe }).foto).toMatch(/JPG, PNG, WEBP o PDF/)

    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "plano.pdf", { type: "application/pdf" })
    expect(validarItem({ ...base, modo: "foto", foto: grande }).foto).toMatch(/10 MB/)
  })

  it("acepta la foto de un celular de 6 MB", () => {
    const celular = new File([new Uint8Array(6 * 1024 * 1024)], "pieza.jpg", { type: "image/jpeg" })
    expect(validarItem({ ...base, modo: "foto", foto: celular }).foto).toBeUndefined()
  })
})

describe("asuntoAutomatico", () => {
  const item = (descripcion: string): ItemPedidoForm => ({ ...base, descripcion })

  it("con un repuesto es su descripción", () => {
    expect(asuntoAutomatico([item(" Filtro de aceite del motor ")])).toBe("Filtro de aceite del motor")
  })

  it("con varios suma cuántos más hay", () => {
    expect(asuntoAutomatico([item("Filtro"), item("Bomba")])).toBe("Filtro (+1 repuesto)")
    expect(asuntoAutomatico([item("Filtro"), item("Bomba"), item("Correa")])).toBe("Filtro (+2 repuestos)")
  })

  it("queda vacío mientras el primer repuesto no tenga descripción", () => {
    expect(asuntoAutomatico([item(" "), item("Bomba")])).toBe("")
    expect(asuntoAutomatico([])).toBe("")
  })

  it("no pasa de 150 caracteres (límite del asunto)", () => {
    const largo = asuntoAutomatico([item("a".repeat(300)), item("Bomba")])
    expect(largo.length).toBeLessThanOrEqual(150)
  })
})
