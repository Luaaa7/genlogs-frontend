import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { CotizacionDetallePage } from './CotizacionDetallePage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

function diaLima(desfaseDias: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + desfaseDias * 86_400_000))
}

let cabecera: Record<string, unknown>
let adjuntos: Record<string, unknown>[]
let seguimientos: Record<string, unknown>[]

function pintar(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/cotizaciones/1']}>
        <Routes>
          <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function elegir(destino: 'Aprobada' | 'Rechazada', comentario: string, archivo?: string) {
  fireEvent.click(await screen.findByRole('radio', { name: destino }))
  fireEvent.change(screen.getByLabelText('Cómo y cuándo respondió'), { target: { value: comentario } })
  if (archivo) fireEvent.change(screen.getByLabelText('Correo o orden de compra'), { target: { value: '9' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar respuesta' }))
}

describe('el Jefe registra la respuesta del cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adjuntos = [{ idAdjunto: 9, nombreArchivo: 'oc-minera.pdf', fechaSubida: '2026-11-02T10:00:00' }]
    seguimientos = [{ codigoEstado: 'ENVIADA', fechaEvento: '2026-11-01T10:00:00' }]
    cabecera = {
      idCotizacion: 1, idCliente: 4, codigoCotizacion: 'COT-001', estado: 'ENVIADA',
      fechaCotizacion: '2026-11-10', fechaValidez: diaLima(10), condicionPago: 'CONTADO',
      moneda: 'PEN', clienteRazonSocial: 'Minera Sur', subtotal: 100, igv: 18, total: 118,
    }
    http.get.mockImplementation((url: string) => {
      if (url === '/cotizaciones/1') return Promise.resolve({ data: cabecera })
      if (url.endsWith('/adjuntos')) return Promise.resolve({ data: adjuntos })
      if (url.endsWith('/seguimiento')) return Promise.resolve({ data: seguimientos })
      if (url.endsWith('/lineas')) return Promise.resolve({ data: [] })
      if (url.startsWith('/ordenes-compra')) return Promise.resolve({ data: { content: [] } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.post.mockResolvedValue({ data: cabecera })
  })

  it('el Jefe la ve en enviada mientras sigue vigente', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    expect(await screen.findByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeTruthy()
  })

  it('el Jefe la ve en negociación el día de la vigencia', async () => {
    cabecera = { ...cabecera, estado: 'EN_NEGOCIACION', fechaValidez: diaLima(0) }
    pintar('JEFE_ADMINISTRATIVO')
    expect(await screen.findByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeTruthy()
  })

  it('el Asistente logístico y el administrativo no la ven', async () => {
    const asistente = pintar('ASISTENTE_LOGISTICO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeNull()
    asistente.unmount()

    pintar('ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeNull()
  })

  it('no aparece en borrador, pendiente, aprobada interna ni aprobada', async () => {
    for (const estado of ['BORRADOR', 'PENDIENTE_APROBACION', 'APROBADA_INTERNA', 'APROBADA']) {
      cabecera = { ...cabecera, estado, fechaValidez: diaLima(10) }
      const vista = pintar('JEFE_ADMINISTRATIVO')
      expect(await screen.findByText('COT-001')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeNull()
      vista.unmount()
    }
  })

  it('no aparece en rechazada, vencida, anulada ni pasada la vigencia', async () => {
    for (const estado of ['RECHAZADA', 'VENCIDA', 'ANULADA']) {
      cabecera = { ...cabecera, estado, fechaValidez: diaLima(10) }
      const vista = pintar('JEFE_ADMINISTRATIVO')
      expect(await screen.findByText('COT-001')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeNull()
      vista.unmount()
    }

    cabecera = { ...cabecera, estado: 'ENVIADA', fechaValidez: diaLima(-1) }
    pintar('JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Registrar la respuesta del cliente' })).toBeNull()
  })

  it('con dos envíos el corte es el primero: el borrador y la misma fecha no salen, uno posterior sí', async () => {
    seguimientos = [
      { codigoEstado: 'ENVIADA', fechaEvento: '2026-11-12T15:00:00' },
      { codigoEstado: 'ENVIADA', fechaEvento: '2026-11-10T10:00:00' },
    ]
    adjuntos = [
      { idAdjunto: 1, nombreArchivo: 'borrador.pdf', fechaSubida: '2026-11-09T09:00:00' },
      { idAdjunto: 2, nombreArchivo: 'en-el-envio.pdf', fechaSubida: '2026-11-10T10:00:00' },
      { idAdjunto: 3, nombreArchivo: 'correo-cliente.pdf', fechaSubida: '2026-11-11T08:00:00' },
      { idAdjunto: 4, nombreArchivo: 'sin-fecha.pdf' },
    ]
    pintar('JEFE_ADMINISTRATIVO')
    const selector = await screen.findByLabelText('Correo o orden de compra')
    const nombres = within(selector).getAllByRole('option').map((opcion) => opcion.textContent)
    expect(nombres).toContain('correo-cliente.pdf')
    expect(nombres).not.toContain('borrador.pdf')
    expect(nombres).not.toContain('en-el-envio.pdf')
    expect(nombres).not.toContain('sin-fecha.pdf')
    expect(screen.queryByText('Carga el correo o la orden de compra en los adjuntos de la cotización.')).toBeNull()
  })

  it('sin el primer envío el selector queda vacío y se mantiene el aviso de cargar el archivo', async () => {
    seguimientos = [{ codigoEstado: 'BORRADOR', fechaEvento: '2026-11-01T10:00:00' }]
    adjuntos = [{ idAdjunto: 1, nombreArchivo: 'borrador.pdf', fechaSubida: '2026-11-09T09:00:00' }]
    pintar('JEFE_ADMINISTRATIVO')
    const selector = await screen.findByLabelText('Correo o orden de compra')
    expect(within(selector).queryByRole('option', { name: 'borrador.pdf' })).toBeNull()
    expect(screen.getByText('Carga el correo o la orden de compra en los adjuntos de la cotización.')).toBeTruthy()
  })

  it('sin comentario o sin adjunto no llama al endpoint', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    fireEvent.click(await screen.findByRole('button', { name: 'Registrar respuesta' }))
    expect(await screen.findByText('Marca si el cliente aprobó o rechazó.')).toBeTruthy()
    expect(screen.getByText('Indica cómo y cuándo respondió el cliente.')).toBeTruthy()
    expect(screen.getByText('Adjunta el correo o la orden de compra de la minera.')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    await elegir('Aprobada', '   ', 'oc-minera.pdf')
    expect(screen.getByText('Indica cómo y cuándo respondió el cliente.')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Correo o orden de compra'), { target: { value: '' } })
    await elegir('Rechazada', 'Respondió por correo el 16/11 a las 9:00')
    expect(screen.getByText('Adjunta el correo o la orden de compra de la minera.')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('Aprobada llama al registro del Jefe y no crea la orden en el frontend', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await elegir('Aprobada', '  Aprobó por correo el 16/11 a las 9:00  ', 'oc-minera.pdf')
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', {
      codigoEstado: 'APROBADA',
      comentario: 'Aprobó por correo el 16/11 a las 9:00',
      idAdjunto: 9,
    }))
    const destinos = http.post.mock.calls.map((llamada) => llamada[0])
    expect(destinos).toEqual(['/cotizaciones/1/respuesta-cliente'])
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
  })

  it('Rechazada usa el mismo registro y no muestra una orden nueva', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await elegir('Rechazada', 'Rechazó por correo el 16/11 a las 11:00', 'oc-minera.pdf')
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', {
      codigoEstado: 'RECHAZADA',
      comentario: 'Rechazó por correo el 16/11 a las 11:00',
      idAdjunto: 9,
    }))
    expect(http.post.mock.calls.map((llamada) => llamada[0])).toEqual(['/cotizaciones/1/respuesta-cliente'])
    expect(screen.queryByText(/orden nueva/i)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
  })
})
