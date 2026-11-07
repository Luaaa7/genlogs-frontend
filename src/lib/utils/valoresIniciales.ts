import type { Tercero } from '@/types/tercero.types'

const ID_POR_CODIGO: Record<string, number> = { RUC: 1, DNI: 2, CE: 3, PAS: 4 }

/**
 * Convierte el Tercero que devuelve el backend (con relaciones anidadas) en los
 * valores iniciales del formulario de edición. Si el backend no manda el
 * distrito, `idDistrito` queda sin valor y la persona debe elegirlo de nuevo.
 */
export function valoresTerceroParaEditar(t: Tercero) {
  const tipo = t.tipoDocumento
  const idTipoDocumento =
    typeof tipo === 'string'
      ? ID_POR_CODIGO[tipo]
      : (tipo?.idTipoDocumento ?? ID_POR_CODIGO[tipo?.codigoTipo ?? ''])
  return {
    idTipoDocumento: idTipoDocumento ?? 1,
    idDistrito: t.distrito?.idDistrito,
    numeroDocumento: t.numeroDocumento ?? '',
    razonSocial: t.razonSocial ?? '',
    direccion: t.direccion ?? '',
    telefono: t.telefono ?? '',
    correo: t.correo ?? t.email ?? '',
  }
}
