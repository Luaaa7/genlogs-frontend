/**
 * Pide a Cloudinary la imagen en el formato más liviano que acepte el navegador (WebP/AVIF),
 * con compresión automática y sin pasar del ancho indicado (en píxeles reales, ya al doble
 * para pantallas de alta densidad). Las URL que no son de Cloudinary vuelven sin cambios.
 */
export function imagenCloudinary(url: string, ancho: number): string {
  const marca = '/image/upload/'
  const i = url.indexOf(marca)
  if (!url.includes('res.cloudinary.com') || i < 0) return url
  const resto = url.slice(i + marca.length)
  // Si ya trae transformaciones (f_, q_, w_, c_...), no se duplican.
  if (/^(?:[a-z]{1,2}_[^/]+,?)+\//.test(resto)) return url
  return `${url.slice(0, i + marca.length)}f_auto,q_auto,c_limit,w_${ancho}/${resto}`
}
