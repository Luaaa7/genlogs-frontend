import { useState } from "react"
import type { Rol, UsuarioRequest } from "@/types/usuario"
import { PanelLateral } from "@/components/ui/PanelLateral"
import { Campo, SeccionForm } from "@/components/ui/campo"
import { inputFormClass } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Button } from "@/components/ui/button"

interface UsuarioFormModalProps {
  roles: Rol[]
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

/** Alta de usuario en el panel lateral (antes, un modal sin etiquetas asociadas). */
export function UsuarioFormModal({ roles, onClose, onSubmit }: UsuarioFormModalProps) {
  const [form, setForm] = useState<UsuarioRequest>(vacio)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch {
      setError("No se pudo crear el usuario. Revisa que el nombre de usuario o el correo no estén en uso.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelLateral abierto titulo="Nuevo usuario" descripcion="Tendrá que cambiar la contraseña temporal al ingresar." onCerrar={onClose}>
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
            <input id="usr-usuario" autoComplete="off" className={inputFormClass} value={form.nombreUsuario} onChange={(e) => setForm({ ...form, nombreUsuario: e.target.value })} required />
          </Campo>
          <Campo id="usr-rol" label="Rol">
            <select id="usr-rol" className={inputFormClass} value={form.idRol} onChange={(e) => setForm({ ...form, idRol: Number(e.target.value) })} required>
              <option value={0} disabled>Selecciona un rol</option>
              {roles.map((rol) => <option key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</option>)}
            </select>
          </Campo>
          <Campo id="usr-password" label="Contraseña temporal" ayuda="Mínimo 8 caracteres.">
            <input
              id="usr-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-describedby="usr-password-ayuda"
              className={inputFormClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Campo>
        </SeccionForm>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Creando…" : "Crear usuario"}</Button>
        </div>
      </form>
    </PanelLateral>
  )
}
