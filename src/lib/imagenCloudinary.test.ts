import { describe, expect, it } from 'vitest'
import { imagenCloudinary } from './imagenCloudinary'

describe('imagenCloudinary', () => {
  it('agrega formato, calidad y ancho a una URL de Cloudinary', () => {
    expect(imagenCloudinary('https://res.cloudinary.com/ftkuxtoc/image/upload/GLB-00026.png', 400))
      .toBe('https://res.cloudinary.com/ftkuxtoc/image/upload/f_auto,q_auto,c_limit,w_400/GLB-00026.png')
  })
  it('respeta la versión y las carpetas', () => {
    expect(imagenCloudinary('https://res.cloudinary.com/x/image/upload/v1793/genlogs/a.jpg', 400))
      .toBe('https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_400/v1793/genlogs/a.jpg')
  })
  it('no toca URL que ya tienen transformaciones ni las que no son de Cloudinary', () => {
    const conTransformacion = 'https://res.cloudinary.com/x/image/upload/w_200/a.jpg'
    expect(imagenCloudinary(conTransformacion, 400)).toBe(conTransformacion)
    expect(imagenCloudinary('https://ejemplo.com/a.jpg', 400)).toBe('https://ejemplo.com/a.jpg')
  })
})
