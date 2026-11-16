import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ConsultaTienda, ResumenTienda } from '@/api/pruebaFuentesApi'

const api = vi.hoisted(() => ({
  resumenPrueba: vi.fn(),
  buscarPrueba: vi.fn(),
  guardarCorrida: vi.fn(),
}))
vi.mock('@/api/pruebaFuentesApi', () => api)

import { PruebaFuentesPage } from './PruebaFuentesPage'

const tienda = (codigo: string, nombre: string, parcial: Partial<ResumenTienda> = {}): ResumenTienda => ({
  codigo, nombre, activa: false, estado: 'ACTIVA', aciertos: null, corrida: 0, aprobada: false, detalle: [], ...parcial,
})

const RESUMEN = [
  tienda('MERCADO_LIBRE', 'Mercado Libre'),
  tienda('EBAY', 'eBay', { aciertos: 6, corrida: 2, aprobada: true, activa: true }),
  tienda('AMAZON', 'Amazon', { aciertos: 3, corrida: 1 }),
]

const CONSULTAS: ConsultaTienda[] = [
  { codigo: 'MERCADO_LIBRE', estado: 'OMITIDA_SESION', motivo: 'Mercado Libre se omitió: primero prueba su sesión.', fichas: [] },
  {
    codigo: 'EBAY', estado: 'OK', motivo: null, fichas: [
      { titulo: 'Filtro CAT 1R-0750', descripcion: 'Original, nuevo', precio: 29.99, codigoMoneda: 'USD',
        urlImagen: 'https://i.ebayimg.com/a.jpg', urlReferencia: 'https://www.ebay.com/itm/375375806750' },
      { titulo: 'Filtro genérico', precio: null, codigoMoneda: null, urlImagen: null, urlReferencia: 'https://www.ebay.com/itm/2' },
    ],
  },
  { codigo: 'AMAZON', estado: 'SIN_RESULTADOS', motivo: null, fichas: [] },
]

async function renderPagina() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><PruebaFuentesPage /></QueryClientProvider>)
  })
}

async function buscar(marca: string, parte: string) {
  fireEvent.change(screen.getByLabelText(/Marca/), { target: { value: marca } })
  fireEvent.change(screen.getByLabelText(/N\.º de parte/), { target: { value: parte } })
  fireEvent.click(screen.getByRole('button', { name: 'Buscar en las tiendas' }))
  await screen.findByRole('region', { name: 'eBay' })
}

describe('Prueba de 10 pedidos (M3, BPMN 9-C, RF-94)', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    sessionStorage.clear()
    api.resumenPrueba.mockResolvedValue(RESUMEN)
    api.buscarPrueba.mockResolvedValue(CONSULTAS)
  })

  it('muestra la tabla de aciertos sobre 10 de cada tienda', async () => {
    await renderPagina()
    const tabla = await screen.findByRole('region', { name: 'Aciertos sobre 10 por tienda' })
    const fila = (nombre: string) => within(tabla).getByRole('row', { name: new RegExp(nombre) })
    expect(within(fila('eBay')).getByText('6 de 10')).toBeTruthy()
    expect(within(fila('eBay')).getByText('Puede activarse')).toBeTruthy()
    expect(within(fila('Amazon')).getByText('Necesita 4 o más')).toBeTruthy()
    expect(within(fila('Mercado Libre')).getByText('Sin correr')).toBeTruthy()
  })

  it('busca marca + N.º de parte y muestra los 6 campos de cada ficha', async () => {
    await renderPagina()
    await buscar('CAT', '1R-0750')
    expect(api.buscarPrueba).toHaveBeenCalledWith('CAT', '1R-0750')
    const ebay = screen.getByRole('region', { name: 'eBay' })
    expect(within(ebay).getByText('Filtro CAT 1R-0750')).toBeTruthy()
    expect(within(ebay).getByText('Original, nuevo')).toBeTruthy()
    expect(within(ebay).getByText('USD 29.99')).toBeTruthy()
    expect(within(ebay).getByText('Sin precio')).toBeTruthy()
    expect(within(ebay).getAllByRole('link', { name: /Ver en la tienda/ })[0].getAttribute('href'))
      .toBe('https://www.ebay.com/itm/375375806750')
    expect(ebay.querySelector('img')?.getAttribute('src')).toBe('https://i.ebayimg.com/a.jpg')
    expect(within(screen.getByRole('region', { name: 'Amazon' })).getByText('Cuenta como «no acertó».')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Mercado Libre' })).getByText('No se evalúa en esta prueba.')).toBeTruthy()
  })

  it('no deja agregar el pedido hasta marcar cada tienda con fichas', async () => {
    await renderPagina()
    await buscar('CAT', '1R-0750')
    const agregar = screen.getByRole('button', { name: /Agregar a la prueba/ }) as HTMLButtonElement
    expect(agregar.disabled).toBe(true)
    expect(screen.getByText('Falta marcar: eBay')).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: 'Acertó: Filtro CAT 1R-0750' }))
    expect(agregar.disabled).toBe(false)
    fireEvent.click(agregar)

    const corrida = screen.getByRole('region', { name: /Prueba en curso/ })
    expect(within(corrida).getByText('1 de 10 pedidos', { exact: false })).toBeTruthy()
    const fila = within(corrida).getByRole('row', { name: /CAT 1R-0750/ })
    expect(within(fila).getByText('Acertó')).toBeTruthy()
    expect(within(fila).getByText('No acertó')).toBeTruthy()
  })

  it('no repite un pedido que ya está en la prueba', async () => {
    sessionStorage.setItem('genlogs-prueba-10-pedidos', JSON.stringify([{ pedido: 'CAT 1R-0750', tiendas: {} }]))
    await renderPagina()
    fireEvent.change(screen.getByLabelText(/N\.º de parte/), { target: { value: '1r-0750' } })
    fireEvent.change(screen.getByLabelText(/Marca/), { target: { value: 'cat' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar en las tiendas' }))
    expect(await screen.findByText(/ya está en esta prueba/)).toBeTruthy()
    expect(api.buscarPrueba).not.toHaveBeenCalled()
  })

  it('con 10 pedidos guarda la prueba solo con las tiendas evaluadas en los 10', async () => {
    const nueve = Array.from({ length: 9 }, (_, i) => ({
      pedido: `CAT 1R-07${60 + i}`,
      tiendas: {
        EBAY: { acerto: i < 3, enlace: i < 3 ? `https://www.ebay.com/itm/${i}` : null },
        AMAZON: { acerto: false, enlace: null },
      },
    }))
    sessionStorage.setItem('genlogs-prueba-10-pedidos', JSON.stringify(nueve))
    api.guardarCorrida.mockResolvedValue([
      { codigo: 'EBAY', nombre: 'eBay', corrida: 3, aciertos: 4, pedidos: 10, aprobada: true, desactivada: false },
      { codigo: 'AMAZON', nombre: 'Amazon', corrida: 2, aciertos: 0, pedidos: 10, aprobada: false, desactivada: false },
    ])
    await renderPagina()
    expect((screen.getByRole('button', { name: 'Guardar prueba' }) as HTMLButtonElement).disabled).toBe(true)

    await buscar('CAT', '1R-0750')
    fireEvent.click(screen.getByRole('radio', { name: 'Acertó: Filtro CAT 1R-0750' }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar a la prueba/ }))

    const guardar = screen.getByRole('button', { name: 'Guardar prueba' }) as HTMLButtonElement
    expect(guardar.disabled).toBe(false)
    fireEvent.click(guardar)

    await waitFor(() => expect(api.guardarCorrida).toHaveBeenCalledTimes(1))
    const enviados = api.guardarCorrida.mock.calls[0][0]
    expect(enviados).toHaveLength(10)
    expect(enviados[9]).toEqual({
      pedido: 'CAT 1R-0750',
      resultados: [
        { fuente: 'EBAY', acerto: true, enlace: 'https://www.ebay.com/itm/375375806750' },
        { fuente: 'AMAZON', acerto: false, enlace: null },
      ],
    })
    const guardada = await screen.findByRole('region', { name: 'Prueba guardada' })
    expect(within(guardada).getByText(/ya puede activarse/)).toBeTruthy()
    expect(sessionStorage.getItem('genlogs-prueba-10-pedidos')).toBeNull()
  })

  it('si no carga la tabla muestra un error claro', async () => {
    api.resumenPrueba.mockRejectedValue(new Error('caído'))
    await renderPagina()
    expect(await screen.findByText(/No se pudieron cargar los aciertos/)).toBeTruthy()
  })
})