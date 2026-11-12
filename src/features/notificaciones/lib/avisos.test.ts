import { describe, expect, it } from "vitest"
import type { NotificacionResponse } from "@/api/contratos/notificaciones"
import { cuandoFue, enlaceInterno, marcarEnLista, textoContador } from "./avisos"

const aviso = (id: number, leida = false): NotificacionResponse => ({
  idNotificacion: id, tipo: "GENERAL", titulo: `Aviso ${id}`, mensaje: null, enlace: null, leida, fechaCreacion: "2026-11-12T08:00:00",
})

describe("campanita (D-21, D-25)", () => {
  it("el contador llega a 9+", () => {
    expect(textoContador(3)).toBe("3")
    expect(textoContador(9)).toBe("9")
    expect(textoContador(10)).toBe("9+")
  })

  it("marcar en la lista baja el contador solo por los que no estaban leídos", () => {
    const r = marcarEnLista({ noLeidas: 2, avisos: [aviso(1), aviso(2), aviso(3, true)] }, [1, 3, 99])
    expect(r.noLeidas).toBe(1)
    expect(r.avisos.map((a) => a.leida)).toEqual([true, false, true])
  })

  it("solo sigue enlaces propios del sistema", () => {
    expect(enlaceInterno("/cotizaciones/15")).toBe("/cotizaciones/15")
    expect(enlaceInterno("https://otro.com")).toBeNull()
    expect(enlaceInterno("//otro.com")).toBeNull()
    expect(enlaceInterno(null)).toBeNull()
  })

  it("dice hace cuánto llegó el aviso", () => {
    const ahora = new Date(2026, 10, 12, 10, 0)
    expect(cuandoFue("2026-11-12T09:59:40", ahora)).toBe("hace un momento")
    expect(cuandoFue("2026-11-12T09:45:00", ahora)).toBe("hace 15 min")
    expect(cuandoFue("2026-11-12T07:00:00", ahora)).toBe("hace 3 h")
    expect(cuandoFue("2026-11-10T07:00:00", ahora)).toMatch(/10/)
    expect(cuandoFue("no es fecha", ahora)).toBe("")
  })
})
