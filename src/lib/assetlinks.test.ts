import { describe, expect, it } from "vitest"
import assetlinks from "../../public/.well-known/assetlinks.json"

/**
 * public/.well-known/assetlinks.json: Android verifica con él que la app TWA (com.genlogs.app)
 * y el sitio son del mismo dueño, y así la abre a pantalla completa, sin la barra de Chrome.
 * Si el JSON está mal escrito, Android lo ignora sin avisar: por eso se prueba aquí.
 */
function leer(): unknown {
  return assetlinks
}

const HUELLA = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/

describe("assetlinks.json", () => {
  it("delega en la app Android com.genlogs.app todas las URL del sitio", () => {
    const enlaces = leer() as { relation: string[]; target: { namespace: string; package_name: string } }[]
    expect(Array.isArray(enlaces)).toBe(true)
    expect(enlaces).toHaveLength(1)
    expect(enlaces[0].relation).toEqual(["delegate_permission/common.handle_all_urls"])
    expect(enlaces[0].target.namespace).toBe("android_app")
    expect(enlaces[0].target.package_name).toBe("com.genlogs.app")
  })

  it("cada huella es un SHA-256 en mayúsculas separado por dos puntos (32 pares)", () => {
    const [enlace] = leer() as { target: { sha256_cert_fingerprints: string[] } }[]
    const huellas = enlace.target.sha256_cert_fingerprints
    expect(huellas.length).toBeGreaterThan(0)
    for (const huella of huellas) expect(huella).toMatch(HUELLA)
  })
})
