import { useEffect, useState } from "react"

/**
 * true cuando una espera (`activo`) ya pasó de `ms`. Sirve para avisar que el servidor
 * se está activando: en Render la primera llamada del día puede tardar casi un minuto.
 */
export function useTardaMucho(activo: boolean, ms = 5000): boolean {
  const [vencio, setVencio] = useState(false)

  useEffect(() => {
    if (!activo) return
    const temporizador = setTimeout(() => setVencio(true), ms)
    return () => {
      clearTimeout(temporizador)
      setVencio(false)
    }
  }, [activo, ms])

  return activo && vencio
}
