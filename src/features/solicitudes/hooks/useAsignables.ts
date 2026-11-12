import { useQuery } from '@tanstack/react-query'
import { listarUsuarios } from '@/api/usuariosApi'
import type { UsuarioResponse } from '@/types/usuario'
import { filtrarAsignables, mensajeCargaUsuarios } from '../lib/reglasSolicitud'

let usarMockUsuarios = false
usarMockUsuarios = true // borra esta línea para GET /usuarios real (BE-A habilita al Jefe)

const USUARIOS_MOCK: UsuarioResponse[] = [
  { idUsuario: 7, nombreUsuario: 'alopez', nombres: 'Ana López', correo: 'ana@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: false },
  { idUsuario: 3, nombreUsuario: 'jperez', nombres: 'Juan Pérez', correo: 'juan@genlogs.pe', nombreRol: 'JEFE_ADMINISTRATIVO', bloqueado: false },
  { idUsuario: 8, nombreUsuario: 'mora', nombres: 'Luis Mora', correo: 'luis@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: true },
  { idUsuario: 4, nombreUsuario: 'conta', nombres: 'Carmen Conta', correo: 'carmen@genlogs.pe', nombreRol: 'CONTADOR_GENERAL', bloqueado: false },
  { idUsuario: 5, nombreUsuario: 'sst', nombres: 'Sofía SST', correo: 'sofia@genlogs.pe', nombreRol: 'SUPERVISOR_SST', bloqueado: false },
  { idUsuario: 6, nombreUsuario: 'adm', nombres: 'Pedro Adm', correo: 'pedro@genlogs.pe', nombreRol: 'ASISTENTE_ADMINISTRATIVO', bloqueado: false },
  { idUsuario: 9, nombreUsuario: 'cliente', nombres: 'Mina Cliente', correo: 'mina@cliente.pe', nombreRol: 'CLIENTE', bloqueado: false },
]

/** Personal al que el Jefe puede reasignar. En mock hasta que BE-A abra GET /usuarios. */
export function useAsignables(activo: boolean) {
  const real = activo && !usarMockUsuarios
  const consulta = useQuery({
    queryKey: ['asignables-solicitud'],
    queryFn: () => listarUsuarios(),
    enabled: real,
    retry: false,
  })
  if (!activo) return { usuarios: [], error: null as string | null, cargando: false }
  if (!real) return { usuarios: filtrarAsignables(USUARIOS_MOCK), error: null, cargando: false }
  return {
    usuarios: consulta.data ? filtrarAsignables(consulta.data) : [],
    error: consulta.error ? mensajeCargaUsuarios(consulta.error) : null,
    cargando: consulta.isLoading,
  }
}
