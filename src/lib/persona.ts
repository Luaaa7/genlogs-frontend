/** Partes del nombre de una persona natural. Se guardan aparte para no repetir la misma persona en un solo texto. */
export interface PartesNombre {
  nombre: string
  segundoNombre: string
  apellidoPaterno: string
  apellidoMaterno: string
}

const vacio: PartesNombre = { nombre: '', segundoNombre: '', apellidoPaterno: '', apellidoMaterno: '' }

/**
 * Separa un nombre ya armado como "nombres apellido paterno apellido materno"
 * (el orden en que el backend junta la consulta del DNI).
 */
export function partirNombre(completo: string): PartesNombre {
  const partes = completo.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 3) {
    const nombres = partes.slice(0, -2)
    return {
      nombre: nombres[0] ?? '',
      segundoNombre: nombres.slice(1).join(' '),
      apellidoPaterno: partes[partes.length - 2] ?? '',
      apellidoMaterno: partes[partes.length - 1] ?? '',
    }
  }
  if (partes.length === 2) return { ...vacio, nombre: partes[0], apellidoPaterno: partes[1] }
  if (partes.length === 1) return { ...vacio, nombre: partes[0] }
  return { ...vacio }
}

/** Vuelve a unir las columnas en el orden que se muestra y se envía al servidor. */
export function armarNombrePersona(p: Partial<PartesNombre>): string {
  return [p.nombre, p.segundoNombre, p.apellidoPaterno, p.apellidoMaterno]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ')
}
