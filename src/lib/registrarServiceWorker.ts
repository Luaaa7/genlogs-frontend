/**
 * Registra el service worker de la PWA (public/sw.js). Solo en producción: en `npm run dev`
 * y en las pruebas no se registra, para no servir archivos viejos mientras se programa.
 * Si el navegador no lo admite o falla, la app sigue funcionando igual.
 */
export function registrarServiceWorker(
  entorno: { produccion: boolean } = { produccion: import.meta.env.PROD },
): void {
  if (!entorno.produccion || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error: unknown) => console.warn("No se pudo registrar el service worker:", error))
  })
}
