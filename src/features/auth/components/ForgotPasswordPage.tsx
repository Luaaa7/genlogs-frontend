import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { solicitarRecuperacion } from "@/api/authApi"

export function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await solicitarRecuperacion(correo.trim())
      setEnviado(true)
    } catch {
      setError("No se pudo procesar la solicitud. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold">Recuperar contraseña</h1>

      {enviado ? (
        <p role="status" className="text-sm">
          Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Ingresa el correo asociado a tu cuenta.
          </p>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Correo</span>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </>
      )}

      <Link to="/login" className="block text-center text-sm text-primary underline">
        Volver al inicio de sesión
      </Link>
    </form>
  )
}