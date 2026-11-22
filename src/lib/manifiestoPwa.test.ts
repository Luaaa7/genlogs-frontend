import { describe, it, expect } from "vitest"
import manifiestoJson from "../../public/manifest.json?raw"
import manifiestoWebmanifest from "../../public/manifest.webmanifest?raw"
import indexHtml from "../../index.html?raw"
import serviceWorker from "../../public/sw.js?raw"
import icono192 from "../../public/icons/icon-192.png?inline"
import icono512 from "../../public/icons/icon-512.png?inline"
import iconoMaskable512 from "../../public/icons/icon-maskable-512.png?inline"

/**
 * PWA · index.html enlaza /manifest.json porque Render sirve .webmanifest como binary/octet-stream.
 * /manifest.webmanifest se conserva (lo usa twa-manifest.json de Android): los dos deben ser iguales.
 */
const json = JSON.parse(manifiestoJson)
const ICONOS: Record<string, string> = {
  "/icons/icon-192.png": icono192,
  "/icons/icon-512.png": icono512,
  "/icons/icon-maskable-512.png": iconoMaskable512,
}

/** Firma y medidas de un PNG (cabecera IHDR) a partir de su data URL. */
function leerPng(dataUrl: string): { firma: string; ancho: number; alto: number } {
  const bin = atob(dataUrl.split(",")[1])
  const byte = (i: number) => bin.charCodeAt(i)
  const u32 = (i: number) => ((byte(i) << 24) | (byte(i + 1) << 16) | (byte(i + 2) << 8) | byte(i + 3)) >>> 0
  const firma = [0, 1, 2, 3].map((i) => byte(i).toString(16).padStart(2, "0")).join("")
  return { firma, ancho: u32(16), alto: u32(20) }
}

describe("manifiesto de la PWA", () => {
  it("manifest.json y manifest.webmanifest tienen el mismo contenido", () => {
    expect(json).toEqual(JSON.parse(manifiestoWebmanifest))
  })

  it("index.html enlaza /manifest.json", () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.json" />')
  })

  it("trae los datos de GenLogs", () => {
    expect(json).toMatchObject({
      name: "GenLogs - Sistema de Gestión",
      short_name: "GenLogs",
      display: "standalone",
      start_url: "/?source=pwa",
      scope: "/",
      id: "/",
    })
  })

  it("los íconos existen y miden lo que dice el manifiesto (192, 512 y maskable 512)", () => {
    const iconos = json.icons as { src: string; sizes: string; purpose: string }[]
    expect(iconos.map((i) => `${i.sizes}/${i.purpose}`)).toEqual(["192x192/any", "512x512/any", "512x512/maskable"])
    for (const i of iconos) {
      const [ancho, alto] = i.sizes.split("x").map(Number)
      expect(ICONOS[i.src], i.src).toBeDefined()
      expect(leerPng(ICONOS[i.src])).toEqual({ firma: "89504e47", ancho, alto })
    }
  })

  it("el service worker guarda /manifest.json y no guarda el API ni peticiones con token", () => {
    expect(serviceWorker).toMatch(/const PRECACHE = \[[^\]]*'\/manifest\.json'/)
    expect(serviceWorker).toContain("if (url.origin !== self.location.origin) return;")
    expect(serviceWorker).toContain("request.headers.has('Authorization')")
  })
})
