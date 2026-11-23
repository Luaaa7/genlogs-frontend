import { afterEach, describe, expect, it, vi } from "vitest"
import { registrarServiceWorker } from "./registrarServiceWorker"

describe("registrarServiceWorker", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, "serviceWorker")
  })

  it("no registra nada fuera de producción", () => {
    const register = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true })
    registrarServiceWorker({ produccion: false })
    window.dispatchEvent(new Event("load"))
    expect(register).not.toHaveBeenCalled()
  })

  it("en producción registra /sw.js con alcance / al cargar la página", () => {
    const register = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true })
    registrarServiceWorker({ produccion: true })
    window.dispatchEvent(new Event("load"))
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" })
  })

  it("si el navegador no tiene service worker, no falla", () => {
    expect(() => registrarServiceWorker({ produccion: true })).not.toThrow()
  })
})
