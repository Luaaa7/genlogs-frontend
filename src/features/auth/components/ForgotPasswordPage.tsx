import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Mail, MailCheck } from "lucide-react"
import { solicitarRecuperacion } from "@/api/authApi"
import { IconInput } from "@/components/ui/IconInput"

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
      className="w-full space-y-5 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-blue-900/5"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Recuperar contraseña</h1>
      </div>

      {enviado ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MailCheck size={24} />
          </div>
          <p role="status" className="text-sm text-slate-600">
            Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">Ingresa el correo asociado a tu cuenta.</p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Correo</label>
            <IconInput
              icon={<Mail size={16} />}
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
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
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </>
      )}

      <Link
        to="/login"
        className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        Volver al inicio de sesión
      </Link>
    </form>
  )
}