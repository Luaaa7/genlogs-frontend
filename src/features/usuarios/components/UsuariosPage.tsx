import { useState } from "react"
import { useUsuarios } from "@/features/usuarios/hooks/useUsuarios"
import { UsuarioFormModal } from "@/features/usuarios/components/UsuarioFormModal"

export function UsuariosPage() {
  const { usuarios, roles, loading, error, agregar, alternarBloqueo } = useUsuarios()
  const [mostrarModal, setMostrarModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <button
          onClick={() => setMostrarModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Nuevo usuario
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando usuarios...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Nombres</th>
                <th className="px-4 py-2 font-medium">Correo</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.idUsuario} className="border-t">
                  <td className="px-4 py-2">{u.nombreUsuario}</td>
                  <td className="px-4 py-2">{u.nombres}</td>
                  <td className="px-4 py-2">{u.correo}</td>
                  <td className="px-4 py-2">{u.nombreRol}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        u.bloqueado
                          ? "rounded-full bg-red-100 px-2 py-1 text-xs text-red-700"
                          : "rounded-full bg-green-100 px-2 py-1 text-xs text-green-700"
                      }
                    >
                      {u.bloqueado ? "Bloqueado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => alternarBloqueo(u.idUsuario, u.bloqueado)}
                      className="rounded-md border px-3 py-1 text-xs font-medium"
                    >
                      {u.bloqueado ? "Desbloquear" : "Bloquear"}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mostrarModal && (
        <UsuarioFormModal
          roles={roles}
          onClose={() => setMostrarModal(false)}
          onSubmit={agregar}
        />
      )}
    </div>
  )
}