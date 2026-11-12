/**
 * Parámetros del sistema (RF-87) agrupados para la pantalla de FE-A. Las
 * claves y las reglas son las de BE-D (EdicionParametrosService): todos son
 * números no negativos; días y cantidades, enteros; y los márgenes van en orden
 * (servicios: mínimo <= sugerido <= aviso <= máximo; repuestos: mínimo <= por
 * defecto <= máximo). El backend vuelve a validar todo al guardar.
 */

export type Unidad = 'soles' | 'porcentaje' | 'dias' | 'cantidad'

export interface CampoParametro {
  clave: string
  etiqueta: string
  unidad: Unidad
  ayuda?: string
}

export interface GrupoParametros {
  id: 'altoValor' | 'margenesServicio' | 'margenesRepuesto' | 'plazos' | 'verificacion'
  titulo: string
  descripcion: string
  campos: CampoParametro[]
  /** Claves que deben quedar en orden no decreciente (de menor a mayor). */
  ordenadas?: string[]
  errorOrden?: string
}

export const GRUPOS_PARAMETROS: GrupoParametros[] = [
  {
    id: 'altoValor',
    titulo: 'Alto valor',
    descripcion: 'Desde este monto, cada cotización aprobada se avisa al Gerente General. Las cotizaciones en dólares se convierten con su tipo de cambio (D-31).',
    campos: [{ clave: 'MONTO_ALTO_VALOR_PEN', etiqueta: 'Monto de alto valor', unidad: 'soles' }],
  },
  {
    id: 'margenesServicio',
    titulo: 'Márgenes de servicios',
    descripcion: 'Entre el mínimo y el aviso es normal; entre el aviso y el máximo se permite con aviso; fuera del mínimo o del máximo aprueba el Jefe Administrativo.',
    campos: [
      { clave: 'MARGEN_SERV_MIN', etiqueta: 'Mínimo', unidad: 'porcentaje' },
      { clave: 'MARGEN_SERV_SUGERIDO', etiqueta: 'Sugerido', unidad: 'porcentaje' },
      { clave: 'MARGEN_SERV_AVISO', etiqueta: 'Aviso desde', unidad: 'porcentaje' },
      { clave: 'MARGEN_SERV_MAX', etiqueta: 'Máximo', unidad: 'porcentaje' },
    ],
    ordenadas: ['MARGEN_SERV_MIN', 'MARGEN_SERV_SUGERIDO', 'MARGEN_SERV_AVISO', 'MARGEN_SERV_MAX'],
    errorOrden: 'Los márgenes de servicios deben cumplir mínimo ≤ sugerido ≤ aviso ≤ máximo.',
  },
  {
    id: 'margenesRepuesto',
    titulo: 'Márgenes de repuestos',
    descripcion: 'Margen de los repuestos de la vitrina sobre el costo puesto en Lima (D-17). Fuera del rango, el producto queda en borrador hasta que lo publique el Jefe Administrativo.',
    campos: [
      { clave: 'MARGEN_REP_MIN', etiqueta: 'Mínimo', unidad: 'porcentaje' },
      { clave: 'MARGEN_REP_DEFAULT', etiqueta: 'Por defecto', unidad: 'porcentaje' },
      { clave: 'MARGEN_REP_MAX', etiqueta: 'Máximo', unidad: 'porcentaje' },
    ],
    ordenadas: ['MARGEN_REP_MIN', 'MARGEN_REP_DEFAULT', 'MARGEN_REP_MAX'],
    errorOrden: 'El margen mínimo de repuestos no puede superar al de por defecto, ni este al máximo.',
  },
  {
    id: 'plazos',
    titulo: 'Plazos de respuesta',
    descripcion: 'Días hábiles para cotizar según el tipo de pedido (sin contar feriados) y cuándo se avisa al asistente.',
    campos: [
      { clave: 'PLAZO_COMUN_DIAS', etiqueta: 'Común nacional', unidad: 'dias' },
      { clave: 'PLAZO_IMPORTADO_DIAS', etiqueta: 'Importado o poco común', unidad: 'dias' },
      { clave: 'PLAZO_ESPECIAL_DIAS', etiqueta: 'Foto, plano o fabricación', unidad: 'dias' },
      { clave: 'ALERTA_PLAZO_PCT', etiqueta: 'Alerta al asistente', unidad: 'porcentaje', ayuda: 'Porcentaje del plazo en que llega el aviso.' },
    ],
  },
  {
    id: 'verificacion',
    titulo: 'Verificación de la vitrina',
    descripcion: 'Cada cuánto se revisa la fuente de los repuestos publicados y cuándo se ocultan solos.',
    campos: [
      { clave: 'VERIFICACION_DIAS', etiqueta: 'Verificar cada', unidad: 'dias' },
      { clave: 'OCULTAR_SIN_VERIF_DIAS', etiqueta: 'Ocultar sin verificar después de', unidad: 'dias' },
      { clave: 'OCULTAR_FALLAS', etiqueta: 'Ocultar tras cotizaciones fallidas', unidad: 'cantidad' },
    ],
  },
]

/** Horario hábil: hoy está fijo en el backend (CalendarioHabil), no es un parámetro editable. */
export const HORARIO_HABIL = [
  { dias: 'Lunes a viernes', horario: '08:00 a 18:00' },
  { dias: 'Sábado', horario: '08:00 a 13:00' },
  { dias: 'Domingo y feriados', horario: 'Cerrado' },
]

export const SUFIJO_UNIDAD: Record<Unidad, string> = { soles: 'S/', porcentaje: '%', dias: 'días', cantidad: 'veces' }

const esEntera = (u: Unidad) => u === 'dias' || u === 'cantidad'

/** Texto escrito → número; acepta coma decimal. NaN si no es un número. */
export function aNumero(texto: string): number {
  const limpio = texto.trim().replace(',', '.')
  return limpio === '' ? Number.NaN : Number(limpio)
}

/** Valor como lo espera el backend: con punto decimal y sin espacios. */
export function aValorBackend(texto: string): string {
  return texto.trim().replace(',', '.')
}

/** Primer problema de un grupo, o null si se puede guardar. */
export function validarGrupo(grupo: GrupoParametros, valores: Record<string, string>): string | null {
  for (const campo of grupo.campos) {
    const texto = valores[campo.clave] ?? ''
    const n = aNumero(texto)
    if (!Number.isFinite(n)) return `Escribe un número en "${campo.etiqueta}".`
    if (n < 0) return `"${campo.etiqueta}" no puede ser negativo.`
    if (esEntera(campo.unidad) && !Number.isInteger(n)) return `"${campo.etiqueta}" debe ser un número entero.`
    if (campo.unidad === 'porcentaje' && n > 100) return `"${campo.etiqueta}" no puede pasar de 100 %.`
  }
  if (grupo.ordenadas) {
    const numeros = grupo.ordenadas.map((c) => aNumero(valores[c] ?? ''))
    for (let i = 1; i < numeros.length; i++) {
      if (numeros[i] < numeros[i - 1]) return grupo.errorOrden ?? 'Revisa el orden de los valores.'
    }
  }
  return null
}

/** Claves cuyo valor escrito es distinto del guardado (comparando como número). */
export function clavesCambiadas(grupo: GrupoParametros, guardados: Record<string, string>, valores: Record<string, string>): string[] {
  return grupo.campos
    .map((c) => c.clave)
    .filter((c) => aNumero(valores[c] ?? '') !== aNumero(guardados[c] ?? ''))
}

/**
 * Orden para guardar de a uno un grupo con orden obligatorio (márgenes de
 * servicios), de modo que cada guardado intermedio también cumpla el orden y el
 * backend no lo rechace: primero los que bajan, de menor a mayor; después los
 * que suben, de mayor a menor. Ejemplo: subir todo el rango de 15/25/35/45 a
 * 50/60/70/80 guarda primero el máximo y al final el mínimo.
 */
export function ordenDeGuardado(ordenadas: string[], guardados: Record<string, string>, valores: Record<string, string>): string[] {
  const antes = (c: string) => aNumero(guardados[c] ?? '')
  const despues = (c: string) => aNumero(valores[c] ?? '')
  const bajan = ordenadas.filter((c) => despues(c) < antes(c))
  const suben = ordenadas.filter((c) => despues(c) > antes(c)).reverse()
  return [...bajan, ...suben]
}
