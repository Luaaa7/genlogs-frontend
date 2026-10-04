import { useState } from "react"
import { Plus, RefreshCw, Users as UsersIcon } from "lucide-react"
import { UsuarioFormModal } from "./UsuarioFormModal"
import { useUsuarios } from "../hooks/useUsuarios"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { PageHeader } from "@/components/ui/PageHeader"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"
import { Button } from "@/components/ui/button"

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

  const nuevo = (
    <Button onClick={() => setMostrarFormulario(true)}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Nuevo usuario
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Usuarios"
        descripcion={<><span className="tabular-nums">{usuarios.length}</span> usuarios con acceso al sistema</>}
        acciones={
          <>
            <Button variant="outline" onClick={() => void recargar()}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Actualizar
            </Button>
            {nuevo}
          </>
        }
      />

      {(error || accionError) && (
        <ErrorBanner message={error || accionError || ""} onRetry={error ? () => void recargar() : undefined} />
      )}

      <TablaCard>
        {!loading && !error && usuarios.length === 0 ? (
          <EstadoVacio
            icono={<UsersIcon className="h-5.5 w-5.5" />}
            titulo="Aún no hay usuarios"
            descripcion="Crea el primero y asígnale un rol."
            accion={nuevo}
          />
        ) : (
          <Tabla titulo="Usuarios">
            <thead>
              <tr>
                <Th>Usuario</Th>
                <Th>Correo</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th><span className="sr-only">Acciones</span></Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={5} />
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.idUsuario} className={filaClass}>
                    <Td>
                      <p className="font-medium text-foreground">{usuario.nombres}</p>
                      <p className="text-xs text-muted-foreground">{usuario.nombreUsuario}</p>
                    </Td>
                    <Td>{usuario.correo}</Td>
                    <Td className="capitalize">{usuario.nombreRol?.toLowerCase()}</Td>
                    <Td>
                      <EstadoBadge tono={usuario.bloqueado ? "destructive" : "success"}>
                        {usuario.bloqueado ? "Bloqueado" : "Activo"}
                      </EstadoBadge>
                    </Td>
                    <Td className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={operandoId === usuario.idUsuario}
                        onClick={() => void cambiarBloqueo(usuario.idUsuario, usuario.bloqueado)}
                        aria-label={`${usuario.bloqueado ? "Desbloquear" : "Bloquear"} a ${usuario.nombres}`}
                      >
                        {operandoId === usuario.idUsuario ? "Guardando…" : usuario.bloqueado ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>

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
    </div>
  )
}
