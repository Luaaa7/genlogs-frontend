import { describe, expect, it } from "vitest"
import { esGtinValido, validarItem, type ItemPedidoForm } from "./itemPedido"

const base: ItemPedidoForm = {
  id: "item-prueba",
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

describe("validarItem (D-01: marca + N.º de parte, o foto/plano)", () => {
  it("con marca y N.º de parte no pide foto", () => {
    expect(validarItem(base)).toEqual({})
  })

  it("sin N.º de parte exige foto o plano", () => {
    expect(validarItem({ ...base, numeroParte: "", marca: "" }).foto).toMatch(/foto o plano/i)
    expect(validarItem({ ...base, numeroParte: "", marca: "", foto })).toEqual({})
  })

  it("si escribe N.º de parte pide también la marca", () => {
    expect(validarItem({ ...base, marca: " " }).marca).toMatch(/marca/i)
  })

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
    expect(validarItem({ ...base, foto: exe }).foto).toMatch(/JPG, PNG, WEBP o PDF/)

    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "plano.pdf", { type: "application/pdf" })
    expect(validarItem({ ...base, foto: grande }).foto).toMatch(/10 MB/)
  })

  it("acepta la foto de un celular de 6 MB", () => {
    const celular = new File([new Uint8Array(6 * 1024 * 1024)], "pieza.jpg", { type: "image/jpeg" })
    expect(validarItem({ ...base, foto: celular }).foto).toBeUndefined()
  })
})
