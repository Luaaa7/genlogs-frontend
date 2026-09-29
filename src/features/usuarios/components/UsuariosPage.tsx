import { useState } from "react"
import { UsuarioFormModal } from "./UsuarioFormModal"
import { useUsuarios } from "../hooks/useUsuarios"

export function UsuariosPage() {
  const { usuarios, roles, loading, error, agregar, alternarBloqueo, recargar } = useUsuarios()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [operandoId, setOperandoId] = useState<number | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)

  async function cambiarBloqueo(idUsuario: number, bloqueado: boolean) {
    setOperandoId(idUsuario)
    setAccionError(null)
    try {
      await alternarBloqueo(idUsuario, bloqueado)
    } catch {
      setAccionError("No se pudo actualizar el estado del usuario.")
    } finally {
      setOperandoId(null)
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Registra usuarios, asigna roles y administra el bloqueo de acceso.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void recargar()}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Nuevo usuario
          </button>
        </div>
      </header>

      {(error || accionError) && (
        <div role="alert" className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error || accionError}</span>
          <button type="button" onClick={() => void recargar()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 font-medium">Usuario</th>
              <th className="p-3 font-medium">Nombres</th>
              <th className="p-3 font-medium">Correo</th>
              <th className="p-3 font-medium">Rol</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Cargando usuarios y roles…</td></tr>
            )}
            {!loading && usuarios.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No hay usuarios registrados. Usa “Nuevo usuario” para crear el primero.</td></tr>
            )}
            {!loading && usuarios.map((usuario) => (
              <tr key={usuario.idUsuario} className="border-t">
                <td className="p-3 font-medium">{usuario.nombreUsuario}</td>
                <td className="p-3">{usuario.nombres}</td>
                <td className="p-3">{usuario.correo}</td>
                <td className="p-3">{usuario.nombreRol}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${usuario.bloqueado ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {usuario.bloqueado ? "Bloqueado" : "Activo"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    disabled={operandoId === usuario.idUsuario}
                    onClick={() => void cambiarBloqueo(usuario.idUsuario, usuario.bloqueado)}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {operandoId === usuario.idUsuario ? "Guardando…" : usuario.bloqueado ? "Desbloquear" : "Bloquear"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <UsuarioFormModal
          roles={roles}
          onClose={() => setMostrarFormulario(false)}
          onSubmit={async (data) => {
            await agregar(data)
            setMostrarFormulario(false)
          }}
        />
      )}
    </section>
  )
}
