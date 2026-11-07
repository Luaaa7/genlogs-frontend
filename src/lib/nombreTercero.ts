/**
 * Nombre del cliente o proveedor según su tipo de documento.
 *
 * Con RUC se guarda la razón social. Con DNI o pasaporte se guardan los
 * nombres, el apellido paterno y el apellido materno por separado, y la razón
 * social se arma con los tres para los listados, las cotizaciones y los PDF.
 */

const limpio = (v?: string | null) => (v ?? '').trim().replace(/\s+/g, ' ')

/** "Nombres Paterno Materno" (sin espacios de más; el materno puede faltar). */
export function nombreCompleto(nombres?: string | null, apellidoPaterno?: string | null, apellidoMaterno?: string | null): string {
  return [limpio(nombres), limpio(apellidoPaterno), limpio(apellidoMaterno)].filter(Boolean).join(' ')
}

type TerceroForm = {
  idTipoDocumento?: number
  razonSocial?: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
}

/**
 * Deja los datos listos para enviar: con RUC quita los nombres y apellidos;
 * con DNI o pasaporte arma la razón social con ellos.
 */
export function prepararNombreTercero<T extends { tercero: TerceroForm }>(valores: T): T & { tercero: { razonSocial: string } } {
  const t = valores.tercero
  if (t.idTipoDocumento === 1) {
    return {
      ...valores,
      tercero: { ...t, razonSocial: limpio(t.razonSocial), nombres: undefined, apellidoPaterno: undefined, apellidoMaterno: undefined },
    }
  }
  const nombres = limpio(t.nombres)
  const apellidoPaterno = limpio(t.apellidoPaterno)
  const apellidoMaterno = limpio(t.apellidoMaterno)
  return {
    ...valores,
    tercero: {
      ...t,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      razonSocial: nombreCompleto(nombres, apellidoPaterno, apellidoMaterno) || limpio(t.razonSocial),
    },
  }
}

/**
 * Para editar clientes registrados antes de separar los apellidos: propone
 * nombres y apellidos a partir del nombre completo, con el orden de RENIEC
 * (nombres, apellido paterno, apellido materno). La persona puede corregirlo.
 */
export function separarNombreCompleto(completo?: string | null): { nombres: string; apellidoPaterno: string; apellidoMaterno: string } {
  const texto = limpio(completo)
  // Formato "PATERNO MATERNO, NOMBRES" (con coma): los apellidos van primero.
  if (texto.includes(',')) {
    const [apellidos, nombres] = texto.split(',', 2).map(limpio)
    const [apellidoPaterno = '', ...resto] = apellidos.split(' ').filter(Boolean)
    return { nombres, apellidoPaterno, apellidoMaterno: resto.join(' ') }
  }
  const partes = texto.split(' ').filter(Boolean)
  if (partes.length >= 3) {
    return { nombres: partes.slice(0, -2).join(' '), apellidoPaterno: partes[partes.length - 2], apellidoMaterno: partes[partes.length - 1] }
  }
  if (partes.length === 2) return { nombres: partes[0], apellidoPaterno: partes[1], apellidoMaterno: '' }
  return { nombres: partes[0] ?? '', apellidoPaterno: '', apellidoMaterno: '' }
}

/** Nombres y apellidos para el formulario de edición: los guardados o, si no hay, los propuestos. */
export function nombresParaEditar(t: {
  razonSocial?: string | null
  nombres?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
}): { nombres: string; apellidoPaterno: string; apellidoMaterno: string } {
  if (limpio(t.nombres) || limpio(t.apellidoPaterno)) {
    return { nombres: limpio(t.nombres), apellidoPaterno: limpio(t.apellidoPaterno), apellidoMaterno: limpio(t.apellidoMaterno) }
  }
  return separarNombreCompleto(t.razonSocial)
}