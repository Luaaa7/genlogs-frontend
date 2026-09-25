import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { login } from "@/api/authApi"
import { useAuthStore } from "@/features/auth/store/authStore"


export function LoginPage() {
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const setAuth = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login({ nombreUsuario, password })
      setAuth(data.token, data.nombreUsuario, data.nombreRol)
      navigate("/")
    } catch {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold">Iniciar sesión</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Usuario</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Contraseña</label>
        <input
          type="password"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm">
      <Link to="/recuperar-password" className="text-primary underline">
        ¿Olvidaste tu contraseña?
      </Link>
      </p>
    </form>
  )
}