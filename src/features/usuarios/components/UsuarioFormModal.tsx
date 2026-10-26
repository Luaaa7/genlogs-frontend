import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { Rol, UsuarioRequest, UsuarioResponse } from "@/types/usuario"
import { PanelLateral } from "@/components/ui/PanelLateral"
import { Campo, SeccionForm } from "@/components/ui/campo"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Button } from "@/components/ui/button"
import { nombreRolLegible } from "@/lib/formatters/roles"

interface UsuarioFormModalProps {
  roles: Rol[]
  /** Si viene, el panel edita ese usuario (sin cambiar usuario ni contraseña). */
  usuario?: UsuarioResponse
  onClose: () => void
  onSubmit: (data: UsuarioRequest) => Promise<void>
}

const vacio: UsuarioRequest = {
  idRol: 0,
  nombreUsuario: "",
  nombres: "",
  correo: "",
  password: "",
  iniciales: "",
}

/** Alta o edición de usuario en el panel lateral. */
export function UsuarioFormModal({ roles, usuario, onClose, onSubmit }: UsuarioFormModalProps) {
  const esEdicion = usuario != null
  const [form, setForm] = useState<UsuarioRequest>(() =>
    usuario
      ? {
          idRol: usuario.idRol ?? roles.find((r) => r.nombreRol === usuario.nombreRol)?.idRol ?? 0,
          nombreUsuario: usuario.nombreUsuario,
          nombres: usuario.nombres,
          correo: usuario.correo,
          password: "",
          iniciales: usuario.iniciales ?? "",
        }
      : vacio
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verPassword, setVerPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch {
      setError(
        esEdicion
          ? "No se pudieron guardar los cambios. Revisa que el correo no esté en uso por otro usuario."
          : "No se pudo crear el usuario. Revisa que el nombre de usuario o el correo no estén en uso."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelLateral
      abierto
      titulo={esEdicion ? "Editar usuario" : "Nuevo usuario"}
      descripcion={
        esEdicion
          ? "El nombre de usuario no se cambia. Para la contraseña, el usuario usa ¿Olvidaste tu contraseña?"
          : "Compártele la contraseña temporal; podrá cambiarla desde ¿Olvidaste tu contraseña?"
      }
      onCerrar={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <SeccionForm titulo="Datos personales">
          <Campo id="usr-nombres" label="Nombres completos">
            <input id="usr-nombres" autoComplete="name" className={inputFormClass} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Campo id="usr-correo" label="Correo">
              <input id="usr-correo" type="email" autoComplete="email" placeholder="nombre@genlogs.pe" className={inputFormClass} value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
            </Campo>
            <Campo id="usr-iniciales" label="Iniciales" ayuda="Hasta 3 letras.">
              <input
                id="usr-iniciales"
                maxLength={3}
                aria-describedby="usr-iniciales-ayuda"
                className={`${inputFormClass} uppercase`}
                value={form.iniciales}
                onChange={(e) => setForm({ ...form, iniciales: e.target.value.toUpperCase() })}
                required
              />
            </Campo>
          </div>
        </SeccionForm>

        <SeccionForm titulo="Acceso">
          <Campo id="usr-usuario" label="Nombre de usuario">
            <input id="usr-usuario" autoComplete="off" disabled={esEdicion} className={inputFormClass} value={form.nombreUsuario} onChange={(e) => setForm({ ...form, nombreUsuario: e.target.value })} required />
          </Campo>
          <Campo id="usr-rol" label="Rol">
            <select id="usr-rol" className={inputFormClass} value={form.idRol} onChange={(e) => setForm({ ...form, idRol: Number(e.target.value) })} required>
              <option value={0} disabled>Selecciona un rol</option>
              {roles.map((rol) => <option key={rol.idRol} value={rol.idRol}>{nombreRolLegible(rol.nombreRol)}</option>)}
            </select>
          </Campo>
          {!esEdicion && (
          <Campo id="usr-password" label="Contraseña temporal" ayuda="Mínimo 8 caracteres.">
            <div className="relative">
              <input
                id="usr-password"
                type={verPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                aria-describedby="usr-password-ayuda"
                className={`${inputFormClass} pr-11`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={verPassword}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {verPassword ? <EyeOff className="h-4.5 w-4.5" aria-hidden="true" /> : <Eye className="h-4.5 w-4.5" aria-hidden="true" />}
              </button>
            </div>
          </Campo>
          )}
        </SeccionForm>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear usuario"}</Button>
        </div>
      </form>
    </PanelLateral>
  )
}