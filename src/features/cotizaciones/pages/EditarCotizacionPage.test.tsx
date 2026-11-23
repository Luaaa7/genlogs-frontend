import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Avisos } from '@/components/ui/Avisos'
import { EditarCotizacionPage } from './EditarCotizacionPage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

vi.mock('../components/AgregarItemModal', () => ({
  AgregarItemModal: ({ onAgregar }: { onAgregar: (item: Record<string, unknown>) => void }) => (
    <>
      <button
        type="button"
        onClick={() => onAgregar({
          producto: 'Aceite',
          idProducto: 11,
          tipoItem: 'producto',
          cantidad: 1,
          precioUnitario: 50,
          costoUnitario: 40,
          margenPorcentaje: 25,
          subtotal: 50,
        })}
      >
        Elegir aceite
      </button>
      <button
        type="button"
        onClick={() => onAgregar({
          producto: 'PLC',
          idServicio: 6,
          tipoItem: 'servicio',
          cantidad: 1,
          precioUnitario: 500,
          subtotal: 500,
        })}
      >
        Elegir servicio sin margen
      </button>
    </>
  ),
}))

const clienteMinera = {
  idCliente: 4,
  situacion: 'ACTIVO',
  status: 'A',
  tercero: {
    idTercero: 4,
    numeroDocumento: '20123456789',
    razonSocial: 'Minera Sur',
    tipoDocumento: { codigoTipo: 'RUC', nombreTipo: 'RUC' },
  },
}

let cabecera: Record<string, unknown>
let lineas: Record<string, unknown>[]
let tipoCambio: Record<string, unknown> | null

const AYUDA_MONEDA = 'La moneda no se puede cambiar al editar un borrador. Para cotizar en otra moneda, duplica la cotización.'

function pintar(rol = 'JEFE_ADMINISTRATIVO') {
  useAuthStore.setState({ nombreRol: rol, token: 't', nombreUsuario: 'jefe' })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <Avisos />
      <MemoryRouter initialEntries={['/cotizaciones/7/editar']}>
        <Routes>
          <Route path="/cotizaciones/:id/editar" element={<EditarCotizacionPage />} />
          <Route path="/cotizaciones/:id" element={<p>Volvió al detalle</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('editar un borrador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cabecera = {
      idCotizacion: 7, idCliente: 4, codigoCotizacion: 'COT-007', estado: 'BORRADOR',
      fechaCotizacion: '2026-11-10', fechaValidez: '2026-12-10', condicionPago: 'CONTADO',
      moneda: 'USD', observaciones: 'Entrega en mina', clienteRazonSocial: 'Minera Sur',
      subtotal: 100, igv: 18, total: 118, tipoCambioUsado: 3.75, puedeEditar: true,
    }
    lineas = [{
      idCotizacionDetalle: 3, idProducto: 9, productoNombre: 'Filtro CAT', idUnidadMedida: 2,
      cantidad: 4, precioUnitario: 25, descuentoUnitario: 0, importeLinea: 100,
    }]
    tipoCambio = { fecha: '2026-11-15', valor: 3.8, esDeHoy: true, codigoMoneda: 'USD', fuente: 'SUNAT' }
    http.get.mockImplementation((url: string) => {
      if (url === '/cotizaciones/7') return Promise.resolve({ data: cabecera })
      if (String(url).endsWith('/lineas')) return Promise.resolve({ data: lineas })
      if (String(url).endsWith('/seguimiento') || String(url).endsWith('/adjuntos')) return Promise.resolve({ data: [] })
      if (url === '/clientes') return Promise.resolve({ data: [clienteMinera] })
      if (url === '/tipo-cambio') return tipoCambio ? Promise.resolve({ data: tipoCambio }) : Promise.reject({ response: { status: 404 } })
      if (url === '/productos') return Promise.resolve({ data: { content: [], totalPages: 0 } })
      if (url === '/servicios') return Promise.resolve({ data: [] })
      if (url === '/catalogos/igv') return Promise.resolve({ data: { porcentaje: 18 } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.put.mockResolvedValue({ data: cabecera })
  })

  it('precarga el borrador y guarda con PUT en el mismo id, sin tipo de cambio', async () => {
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    expect((screen.getByLabelText(/observaciones/i) as HTMLTextAreaElement).value).toBe('Entrega en mina')
    expect((await screen.findAllByText('Minera Sur')).length).toBeGreaterThan(0)
    const dolares = screen.getByRole('radio', { name: 'Dólares ($)' }) as HTMLInputElement
    expect(dolares.disabled).toBe(true)
    expect(dolares.getAttribute('aria-describedby')).toContain('cot-moneda-ayuda')
    expect(screen.getByText(AYUDA_MONEDA).id).toBe('cot-moneda-ayuda')
    expect(screen.queryByText(/no se guardan en la cotización/)).toBeNull()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getAllByText('No guardado').length).toBeGreaterThan(0)
    expect(screen.queryByRole('spinbutton', { name: 'Margen del ítem 1 en porcentaje' })).toBeNull()
    expect(screen.queryByRole('spinbutton', { name: 'Costo unitario del ítem 1' })).toBeNull()
    expect(screen.queryByText(/Bajo el mínimo/)).toBeNull()
    const revisar = screen.getByRole('button', { name: 'Revisar y guardar' }) as HTMLButtonElement
    await waitFor(() => expect(revisar.disabled).toBe(false))
    fireEvent.click(revisar)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y guardar' }))
    await waitFor(() => expect(http.put).toHaveBeenCalledTimes(1))
    const [ruta, cuerpo] = http.put.mock.calls[0]
    expect(ruta).toBe('/cotizaciones/7')
    expect(cuerpo.clienteId).toBe(4)
    expect(cuerpo.moneda).toBe('USD')
    expect(cuerpo.detalles[0].producto).toBe('Filtro CAT')
    expect(cuerpo.detalles[0].precioUnitario).toBe(25)
    expect(cuerpo.detalles[0].margenPorcentaje).toBeNull()
    expect(cuerpo.detalles[0].costoUnitario).toBeNull()
    expect(cuerpo.tipoCambio).toBeUndefined()
    expect(cuerpo.fechaTipoCambio).toBeUndefined()
    expect(await screen.findByText('Cotización actualizada. Vuelve a solicitar la aprobación.')).toBeTruthy()
    expect(screen.getByText('Volvió al detalle')).toBeTruthy()
  })

  it('si el borrador no trae tipo de cambio, el PUT no lo inventa ni pide el del día', async () => {
    cabecera = { ...cabecera, tipoCambioUsado: null }
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    const revisar = screen.getByRole('button', { name: 'Revisar y guardar' }) as HTMLButtonElement
    await waitFor(() => expect(revisar.disabled).toBe(false))
    fireEvent.click(revisar)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y guardar' }))
    await waitFor(() => expect(http.put).toHaveBeenCalledTimes(1))
    const cuerpo = http.put.mock.calls[0][1] as { tipoCambio?: number; fechaTipoCambio?: string }
    expect(cuerpo.tipoCambio).toBeUndefined()
    expect(cuerpo.fechaTipoCambio).toBeUndefined()
    expect(http.get.mock.calls.some((llamada) => llamada[0] === '/tipo-cambio')).toBe(false)
  })

  it('el asistente administrativo no ve la nota ni el costo ni el margen', async () => {
    pintar('ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    expect(screen.queryByText(/no se guardan en la cotización/)).toBeNull()
    expect(screen.queryByText('No guardado')).toBeNull()
    expect(screen.queryByRole('spinbutton', { name: /Margen del ítem 1/ })).toBeNull()
    expect(screen.queryByRole('spinbutton', { name: /Costo unitario del ítem 1/ })).toBeNull()
  })

  it('precarga el costo y el margen y el guardado envía los valores de pantalla', async () => {
    lineas = [{ ...lineas[0], costoUnitario: 40, margenPorcentaje: 25 }]
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    const costo = screen.getByRole('spinbutton', { name: 'Costo unitario del ítem 1' }) as HTMLInputElement
    const margen = screen.getByRole('spinbutton', { name: 'Margen del ítem 1 en porcentaje' }) as HTMLInputElement
    const precio = screen.getByRole('spinbutton', { name: 'Precio unitario del ítem 1' }) as HTMLInputElement
    expect(costo.value).toBe('40')
    expect(margen.value).toBe('25')
    expect(precio.value).toBe('25')
    expect(screen.queryByText('No guardado')).toBeNull()
    expect(screen.queryByText(/no se guardan en la cotización/)).toBeNull()
    fireEvent.change(precio, { target: { value: '50' } })
    expect(margen.value).toBe('20')
    const revisar = screen.getByRole('button', { name: 'Revisar y guardar' }) as HTMLButtonElement
    await waitFor(() => expect(revisar.disabled).toBe(false))
    fireEvent.click(revisar)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y guardar' }))
    await waitFor(() => expect(http.put).toHaveBeenCalledTimes(1))
    const cuerpo = http.put.mock.calls[0][1] as { detalles: { costoUnitario: number | null; margenPorcentaje: number | null; precioUnitario: number }[] }
    expect(cuerpo.detalles[0].costoUnitario).toBe(40)
    expect(cuerpo.detalles[0].margenPorcentaje).toBe(20)
    expect(cuerpo.detalles[0].precioUnitario).toBe(50)
  })

  it('un servicio agregado sin margen muestra los inputs y la línea vieja sigue sin guardarse', async () => {
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir servicio sin margen' }))
    expect(screen.getByRole('spinbutton', { name: 'Margen del ítem 2 en porcentaje' })).toBeTruthy()
    expect(screen.getByRole('spinbutton', { name: 'Costo unitario del ítem 2' })).toBeTruthy()
    expect(screen.getAllByText('No guardado').length).toBeGreaterThan(0)
    expect(screen.queryByText('0 %')).toBeNull()
  })

  it('una línea agregada durante la edición conserva su margen', async () => {
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir aceite' }))
    const margen = screen.getByRole('spinbutton', { name: 'Margen del ítem 2 en porcentaje' }) as HTMLInputElement
    expect(margen.value).toBe('25')
    expect(screen.queryByRole('spinbutton', { name: 'Margen del ítem 1 en porcentaje' })).toBeNull()
    expect(screen.queryByText(/Bajo el mínimo/)).toBeNull()
  })

  it('con puedeEditar en negociación sigue mostrando el formulario', async () => {
    cabecera = { ...cabecera, estado: 'EN_NEGOCIACION', puedeEditar: true }
    pintar()
    expect(await screen.findByDisplayValue('Filtro CAT')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Revisar y guardar' })).toBeTruthy()
  })

  it('sin puedeEditar avisa y no muestra el formulario', async () => {
    cabecera = { ...cabecera, estado: 'EN_NEGOCIACION', puedeEditar: false }
    pintar()
    expect((await screen.findByRole('alert')).textContent).toContain('Solo se edita un borrador o una cotización cuando el cliente quiere cambios.')
    expect(screen.getByRole('link', { name: 'Volver al detalle' }).getAttribute('href')).toBe('/cotizaciones/7')
    expect(screen.queryByRole('button', { name: 'Revisar y guardar' })).toBeNull()
    expect(screen.queryByDisplayValue('Filtro CAT')).toBeNull()
    expect(http.put).not.toHaveBeenCalled()
  })
})
