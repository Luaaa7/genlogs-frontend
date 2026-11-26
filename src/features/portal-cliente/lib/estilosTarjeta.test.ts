import { describe, expect, it } from "vitest"
import { ENTRADA_TARJETA, TARJETA_ELEVABLE, retardoEntrada } from "./estilosTarjeta"

describe("estilos compartidos de tarjeta", () => {
  it("la elevación al pasar el cursor es sutil y se apaga con movimiento reducido", () => {
    for (const clase of ["transition-all", "hover:-translate-y-0.5", "hover:shadow-md", "motion-reduce:transition-none", "motion-reduce:hover:translate-y-0"]) {
      expect(TARJETA_ELEVABLE).toContain(clase)
    }
  })

  it("la entrada es un fade-in con desplazamiento que no se queda fija (para no anular el hover)", () => {
    expect(ENTRADA_TARJETA).toContain("animate-[tarjeta-entra_")
    expect(ENTRADA_TARJETA).toContain("backwards")
    expect(ENTRADA_TARJETA).not.toContain("both")
    expect(ENTRADA_TARJETA).toContain("motion-reduce:animate-none")
  })

  it("el retardo escalona de 60 ms en 60 ms y se detiene en la 9.ª tarjeta", () => {
    expect(retardoEntrada(0)).toEqual({ animationDelay: "0ms" })
    expect(retardoEntrada(1)).toEqual({ animationDelay: "60ms" })
    expect(retardoEntrada(3)).toEqual({ animationDelay: "180ms" })
    expect(retardoEntrada(8)).toEqual({ animationDelay: "480ms" })
    expect(retardoEntrada(30)).toEqual({ animationDelay: "480ms" })
  })
})
