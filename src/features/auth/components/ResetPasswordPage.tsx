import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { restablecerPassword } from "@/api/authApi"

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
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6 shadow-sm">
        <p className="text-sm">El enlace no contiene un token válido.</p>
        <Link to="/recuperar-password" className="text-sm text-primary underline">
          Solicitar otro enlace
        </Link>
      </div>
    )
  }

  if (completado) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6 shadow-sm">
        <p role="status" className="text-sm">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </p>
        <Link to="/login" className="text-sm text-primary underline">
          Ir al login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold">Nueva contraseña</h1>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Contraseña nueva</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Confirmar contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  )
}