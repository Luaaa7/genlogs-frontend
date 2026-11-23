import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AdjuntoCotizacion } from '@/types/cotizacion.types'
import { AdjuntoCotizacionUploader } from './AdjuntoCotizacionUploader'

function adjunto(parcial: Partial<AdjuntoCotizacion>): AdjuntoCotizacion {
  return {
    id: 1,
    nombreArchivo: '20261123-01ADM.pdf',
    urlArchivo: 'https://archivos.example/cot.pdf',
    urlCloudinary: 'https://archivos.example/cot.pdf',
    tipoArchivo: 'pdf',
    tamanio: 0,
    fechaSubida: '2026-11-23T14:00:00',
    subidoPor: 'admin',
    ...parcial,
  }
}

function pintar(adjuntos: AdjuntoCotizacion[]) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <AdjuntoCotizacionUploader cotizacionId={1} adjuntos={adjuntos} readonly />
    </QueryClientProvider>,
  )
}

describe('visor de adjuntos', () => {
  it('abre el PDF en el visor y deja la descarga', () => {
    pintar([adjunto({})])
    expect(screen.getByRole('link', { name: 'Descargar 20261123-01ADM.pdf' }).getAttribute('href')).toBe('https://archivos.example/cot.pdf')
    fireEvent.click(screen.getByRole('button', { name: 'Ver 20261123-01ADM.pdf' }))
    const marco = screen.getByTitle('20261123-01ADM.pdf')
    expect(marco.getAttribute('src')).toBe('https://archivos.example/cot.pdf')
    expect(marco.tagName).toBe('IFRAME')
  })

  it('muestra una imagen en el visor', () => {
    pintar([adjunto({
      nombreArchivo: 'ficha.png',
      tipoArchivo: 'png',
      urlArchivo: 'https://archivos.example/ficha.png',
      urlCloudinary: 'https://archivos.example/ficha.png',
    })])
    fireEvent.click(screen.getByRole('button', { name: 'Ver ficha.png' }))
    expect(screen.getByRole('img', { name: 'ficha.png' }).getAttribute('src')).toBe('https://archivos.example/ficha.png')
  })

  it('un Word no abre el visor', () => {
    pintar([adjunto({ nombreArchivo: 'alcance.docx', tipoArchivo: 'docx', urlCloudinary: 'https://archivos.example/alcance.docx' })])
    expect(screen.queryByRole('button', { name: 'Ver alcance.docx' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Descargar alcance.docx' })).toBeTruthy()
  })
})
