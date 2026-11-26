/**
 * Foto referencial (simulada) por tipo de repuesto, mientras el producto no tenga foto propia.
 * Las imágenes viven en /public/repuestos/<clave>.svg. Si un archivo no existe, la tarjeta
 * cae a la ilustración de su categoría, así que se pueden ir agregando de a poco.
 *
 * Igual que visualCategoria: primero se mira el nombre y luego la categoría; gana la primera regla.
 */
const REGLAS: [RegExp, string][] = [
  [/filtr/, "filtro"],
  [/adaptador|cargador|fuente de poder|enchufe/, "adaptador"],
  [/altavoz|parlante|speaker|amplific|audio|bocina/, "altavoz"],
  [/anem[oó]metro|viento|ventil/, "anemometro"],
  [/termo|temperat|termocupla/, "termometro"],
  [/rodam|cojinet/, "rodamiento"],
  [/engran|transmis|motor|mec[aá]n/, "mecanico"],
  [/el[eé]ctric|energ|bater|cable/, "electrico"],
  [/automat|control|sensor|instrument|medic|aislad/, "instrumento"],
  [/segur|epp|protecc|casco/, "seguridad"],
  [/herramient|llave/, "herramienta"],
  [/hidr[aá]ul|bomba|fluid|lubric|aceite/, "hidraulico"],
  [/veh[ií]cul|cami[oó]n|transporte|neum/, "vehiculo"],
  [/componente|accesorio|electr[oó]nic|conector/, "componente"],
]

function clave(texto: string): string | undefined {
  return REGLAS.find(([patron]) => patron.test(texto))?.[1]
}

export function fotoReferencial(categoria?: string | null, nombre?: string | null): string {
  const k = clave((nombre ?? "").toLowerCase()) ?? clave((categoria ?? "").toLowerCase()) ?? "generico"
  return `/repuestos/${k}.svg`
}
