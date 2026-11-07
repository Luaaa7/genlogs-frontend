import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock } from "lucide-react"
import { login } from "@/api/authApi"
import { useAuthStore } from "@/features/auth/store/authStore"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { IconInput } from "@/components/ui/IconInput"

const INTENTOS_ARRANQUE = 4
const ESPERA_REINTENTO_MS = 5_000

/** ¿El fallo parece "servidor dormido / arrancando" y no un error real de credenciales? */
function falloDeArranque(error: unknown) {
  const err = error as { code?: string; response?: { status?: number } }
  return !err.response || err.code === "ECONNABORTED" || [502, 503, 504].includes(err.response.status ?? 0)
}

export function LoginPage() {
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const setAuth = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setLoading(true)
    try {
      // Si el servidor estaba dormido, se reintenta solo en vez de pedirle al usuario que lo haga a mano.
      let data = null as Awaited<ReturnType<typeof login>> | null
      for (let intento = 1; data === null; intento++) {
        try {
          data = await login({ nombreUsuario, password })
        } catch (e) {
          if (!falloDeArranque(e) || intento >= INTENTOS_ARRANQUE) throw e
          setAviso(`El servidor está despertando… reintentando (${intento}/${INTENTOS_ARRANQUE - 1})`)
          await new Promise((r) => setTimeout(r, ESPERA_REINTENTO_MS))
        }
      }

      // Clave unificada para match con ProtectedRoute y axiosClient
      const tokenRecibido = data.token;
      if (tokenRecibido) {
        localStorage.setItem("access_token", tokenRecibido)
      }
      
      setAuth(tokenRecibido, data.nombreUsuario, data.nombreRol)
      navigate("/dashboard")
    } catch (error: unknown) {
      const err = error as {
        code?: string
        response?: { status?: number; data?: { message?: string; error?: string } }
      }

      // 1) Timeout: el servidor de Render gratuito tarda en despertar.
      if (err.code === "ECONNABORTED") {
        setError("El servidor está despertando. Espera unos segundos y vuelve a intentar.")
        return
      }

      // 2) Sin respuesta: servidor caído, URL incorrecta o bloqueo por CORS.
      if (!err.response) {
        console.error("Sin respuesta del servidor (revisa VITE_API_URL y CORS):", error)
        setError("No se pudo conectar con el servidor. Verifica tu conexión o inténtalo más tarde.")
        return
      }

      // 3) El backend respondió con un mensaje.
      const data = err.response.data
      if (import.meta.env.DEV) console.error("Respuesta del backend:", err.response.status, data)
      setError(data?.message || data?.error || "Usuario o contraseña incorrectos.")
      return
    } finally {
      setLoading(false)
      setAviso(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Ingresa tus credenciales para continuar.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-usuario" className="text-sm font-medium text-foreground">Usuario</label>
        <IconInput
          id="login-usuario"
          name="username"
          autoComplete="username"
          icon={<User size={16} />}
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          placeholder="Ingrese su usuario"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-foreground">Contraseña</label>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingrese su contraseña"
          required
        />
      </div>

      {aviso && (
        <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{aviso}</p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-primary/90 active:scale-[0.97] motion-reduce:active:scale-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm">
        <Link to="/recuperar-password" className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}