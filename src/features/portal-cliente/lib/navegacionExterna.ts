/** Salida a una página fuera del sistema (checkout de Mercado Pago). Separado para poder probarlo. */
export const navegacionExterna = {
  ir: (url: string) => {
    window.location.assign(url)
  },
}
