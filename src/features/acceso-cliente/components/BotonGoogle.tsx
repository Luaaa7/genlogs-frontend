import { useEffect, useRef } from "react"

const SCRIPT_GOOGLE = "https://accounts.google.com/gsi/client"

interface RespuestaGoogle {
  credential?: string
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (opciones: { client_id: string; callback: (r: RespuestaGoogle) => void; ux_mode?: string }) => void
      renderButton: (contenedor: HTMLElement, opciones: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

let cargaScript: Promise<void> | null = null

/** Carga una sola vez el script de «Acceder con Google» (Google Identity Services). */
function cargarGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (cargaScript) return cargaScript
  cargaScript = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_GOOGLE
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      cargaScript = null
      reject(new Error("No se pudo cargar Google"))
    }
    document.head.appendChild(script)
  })
  return cargaScript
}

interface Props {
  onCredential: (credential: string) => void
  /** Texto del botón de Google: «Continuar con Google» o «Registrarse con Google». */
  texto?: "continue_with" | "signup_with" | "signin_with"
}

/**
 * Botón oficial de Google (v3.4). Usa VITE_GOOGLE_CLIENT_ID; si no está configurado,
 * no se muestra y el cliente sigue con su correo y contraseña.
 */
export function BotonGoogle({ onCredential, texto = "continue_with" }: Props) {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim()
  const contenedor = useRef<HTMLDivElement>(null)
  // El callback de Google se registra una vez; así siempre llama a la versión actual.
  const callback = useRef(onCredential)
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return
    let activo = true
    cargarGoogle()
      .then(() => {
        const google = window.google
        if (!activo || !google || !contenedor.current) return
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (respuesta) => {
            if (respuesta.credential) callback.current(respuesta.credential)
          },
        })
        google.accounts.id.renderButton(contenedor.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: texto,
          locale: "es",
          width: 320,
        })
      })
      .catch(() => {
        /* sin Google (bloqueado o sin conexión): queda el ingreso con correo */
      })
    return () => {
      activo = false
    }
  }, [clientId, texto])

  if (!clientId) return null
  return <div ref={contenedor} data-testid="boton-google" className="flex min-h-10 justify-center" />
}
