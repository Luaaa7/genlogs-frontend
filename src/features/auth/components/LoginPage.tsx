import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock } from "lucide-react"
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
      
      // ✅ Clave unificada para match con ProtectedRoute y axiosClient
      const tokenRecibido = data.token || data.token;
      if (tokenRecibido) {
        localStorage.setItem("access_token", tokenRecibido)
      }
      
      setAuth(tokenRecibido, data.nombreUsuario, data.nombreRol)
      navigate("/dashboard")
    } catch (error: unknown) {
      if (error && typeof error === "object") {
        // Validamos si fue un error de tiempo de espera (timeout / servidor durmiéndose)
        if ("code" in error && (error as { code?: string }).code === "ECONNABorted") {
          console.error("El servidor tardó demasiado en responder (Cold Start).");
          setError("El servidor está despertando. Por favor, espera unos segundos y vuelve a intentar.");
          return;
        }

        // Validamos si el backend respondió con un mensaje de error específico
        if ("response" in error) {
          const err = error as { response?: { data?: { message?: string } } };
          console.error("Detalle exacto del backend:", err.response?.data);
          setError(err.response?.data?.message || "Usuario o contraseña incorrectos.");
          return;
        }
      }

      // Fallback para cualquier otro error imprevisto
      console.error("Error desconocido:", error);
      setError("Ocurrió un error inesperado al intentar iniciar sesión.");
    }finally {
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
        <label className="text-sm font-medium text-slate-700">Usuario</label>
        <IconInput
          icon={<User size={16} />}
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          placeholder="Ingrese su usuario"
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