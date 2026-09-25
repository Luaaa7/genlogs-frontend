import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock } from "lucide-react"
import { login } from "@/api/authApi"
import { useAuthStore } from "@/features/auth/store/authStore"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { IconInput } from "@/components/ui/IconInput"

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
      setError("Correo o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Iniciar sesión</h1>
        <p className="text-sm text-slate-500">Ingresa tus credenciales para continuar.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Correo</label>
        <IconInput
          icon={<Mail size={16} />}
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          placeholder="Ingrese su correo"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <PasswordInput
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingrese su contraseña"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm">
        <Link to="/recuperar-password" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}