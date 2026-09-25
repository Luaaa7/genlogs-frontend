import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Lock, CheckCircle2 } from "lucide-react"
import { restablecerPassword } from "@/api/authApi"
import { PasswordInput } from "@/components/ui/PasswordInput"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [completado, setCompletado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (nuevaPassword !== confirmacion) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    try {
      await restablecerPassword(token, nuevaPassword)
      setCompletado(true)
    } catch {
      setError("El enlace venció o no es válido. Solicita uno nuevo desde el login.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full space-y-4 text-center">
        <p className="text-sm text-slate-600">El enlace no contiene un token válido.</p>
        <Link to="/recuperar-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Solicitar otro enlace
        </Link>
      </div>
    )
  }

  if (completado) {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <CheckCircle2 size={24} />
        </div>
        <p role="status" className="text-sm text-slate-600">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </p>
        <Link
          to="/login"
          className="w-full rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-opacity hover:opacity-90"
        >
          Ir al login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Nueva contraseña</h1>
        <p className="text-sm text-slate-500">Debe tener al menos 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Contraseña nueva</label>
        <PasswordInput
          icon={<Lock size={16} />}
          autoComplete="new-password"
          minLength={8}
          required
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Confirmar contraseña</label>
        <PasswordInput
          icon={<Lock size={16} />}
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  )
}