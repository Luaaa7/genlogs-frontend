import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { FuenteConfig } from '@/api/fuentesApi'

const api = vi.hoisted(() => ({
  listarFuentes: vi.fn(),
  guardarCredenciales: vi.fn(),
  probarSesion: vi.fn(),
  activarFuente: vi.fn(),
  cambiarParametros: vi.fn(),
  listarSelectores: vi.fn(),
  guardarSelectores: vi.fn(),
}))
vi.mock('@/api/fuentesApi', () => api)

import { FuentesBusquedaPage } from './FuentesBusquedaPage'

function fuente(parcial: Partial<FuenteConfig>): FuenteConfig {
  return {
    codigo: 'EBAY', nombre: 'eBay', urlBase: 'https://www.ebay.com', activa: false, estado: 'SIN_PROBAR',
    sesionValidaHasta: null, ultimaPrueba: null, ultimoError: null, pausaSegundos: 5, limiteDiario: 50,
    aciertosPrueba: null, tieneUsuario: false, tieneClave: false, ...parcial,
  }
}

async function renderPagina(rol = 'JEFE_ADMINISTRATIVO') {
  useAuthStore.getState().login('token', 'usuario', rol)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><FuentesBusquedaPage /></QueryClientProvider>)
  })
}

const tarjeta = (nombre: string) => screen.getByRole('region', { name: nombre })
const boton = (zona: HTMLElement, nombre: string) => within(zona).getByRole('button', { name: nombre }) as HTMLButtonElement

describe('Configuración > Fuentes de búsqueda (L2, BPMN 9-A)', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarFuentes.mockResolvedValue([
      fuente({ codigo: 'MERCADO_LIBRE', nombre: 'Mercado Libre' }),
      fuente({ codigo: 'EBAY', nombre: 'eBay', estado: 'CON_ERROR', ultimoError: 'La tienda bloqueó la lectura.', tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'AMAZON', nombre: 'Amazon', estado: 'ACTIVA', aciertosPrueba: 3, tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'ALIEXPRESS', nombre: 'AliExpress', estado: 'ACTIVA', aciertosPrueba: 6, tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'ALIBABA', nombre: 'Alibaba', estado: 'REQUIERE_VERIFICACION', ultimoError: 'La tienda pidió un código.' }),
    ])
    api.guardarCredenciales.mockResolvedValue(undefined)
    api.activarFuente.mockResolvedValue(undefined)
    api.cambiarParametros.mockResolvedValue(undefined)
  })

  it('muestra una tarjeta por tienda con su estado en palabras y el último error', async () => {
    await renderPagina()
    expect(await screen.findAllByRole('region')).toHaveLength(5)
    expect(within(tarjeta('Mercado Libre')).getByText('Sin probar')).toBeTruthy()
    expect(within(tarjeta('eBay')).getByText('Con error')).toBeTruthy()
    expect(within(tarjeta('eBay')).getByText('La tienda bloqueó la lectura.')).toBeTruthy()
    expect(within(tarjeta('Alibaba')).getByText('Requiere verificación')).toBeTruthy()
    expect(within(tarjeta('AliExpress')).getByText('6 de 10')).toBeTruthy()
  })

  it('guarda la cuenta de búsqueda: la clave se escribe enmascarada y no vuelve a mostrarse', async () => {
    await renderPagina()
    const ml = await screen.findByRole('region', { name: 'Mercado Libre' })
    const clave = within(ml).getByLabelText('Contraseña')
    expect(clave.getAttribute('type')).toBe('password')

    fireEvent.change(within(ml).getByLabelText('Usuario o correo'), { target: { value: 'busqueda@genlogs.pe' } })
    fireEvent.change(clave, { target: { value: 'Secreta-123' } })
    fireEvent.click(within(ml).getByRole('button', { name: 'Guardar cuenta' }))

    await waitFor(() => expect(api.guardarCredenciales).toHaveBeenCalledWith('MERCADO_LIBRE', { usuario: 'busqueda@genlogs.pe', clave: 'Secreta-123' }))
    await waitFor(() => expect((clave as HTMLInputElement).value).toBe(''))
  })

  it('no envía la cuenta vacía', async () => {
    await renderPagina()
    const ml = await screen.findByRole('region', { name: 'Mercado Libre' })
    fireEvent.click(within(ml).getByRole('button', { name: 'Guardar cuenta' }))
    expect(await within(ml).findByText(/Escribe el usuario o la contraseña/)).toBeTruthy()
    expect(api.guardarCredenciales).not.toHaveBeenCalled()
  })

  it('«Probar sesión» solo se puede con la cuenta guardada y muestra el resultado', async () => {
    api.probarSesion.mockResolvedValue(fuente({ codigo: 'EBAY', nombre: 'eBay', estado: 'ACTIVA', tieneUsuario: true, tieneClave: true }))
    await renderPagina()
    const ml = await screen.findByRole('region', { name: 'Mercado Libre' })
    expect(boton(ml, 'Probar sesión').disabled).toBe(true)

    fireEvent.click(within(tarjeta('eBay')).getByRole('button', { name: 'Probar sesión' }))
    await waitFor(() => expect(api.probarSesion).toHaveBeenCalledWith('EBAY'))
  })

  it('«Activar» solo con la sesión activa y 4 o más aciertos de 10 (D-37)', async () => {
    await renderPagina()
    await screen.findAllByRole('region')
    expect(boton(tarjeta('Amazon'), 'Activar').disabled).toBe(true)
    expect(within(tarjeta('Amazon')).getByText(/4 o más aciertos/)).toBeTruthy()
    expect(boton(tarjeta('eBay'), 'Activar').disabled).toBe(true)

    const aliexpress = tarjeta('AliExpress')
    expect(boton(aliexpress, 'Activar').disabled).toBe(false)
    fireEvent.click(within(aliexpress).getByRole('button', { name: 'Activar' }))
    await waitFor(() => expect(api.activarFuente).toHaveBeenCalledWith('ALIEXPRESS', true))
  })

  it('pausa y límite diario se validan antes de guardar', async () => {
    await renderPagina()
    const ebay = await screen.findByRole('region', { name: 'eBay' })
    fireEvent.change(within(ebay).getByLabelText('Pausa entre búsquedas'), { target: { value: '500' } })
    fireEvent.click(within(ebay).getByRole('button', { name: 'Guardar límites' }))
    expect(await within(ebay).findByText(/entre 0 y 300/)).toBeTruthy()
    expect(api.cambiarParametros).not.toHaveBeenCalled()

    fireEvent.change(within(ebay).getByLabelText('Pausa entre búsquedas'), { target: { value: '10' } })
    fireEvent.change(within(ebay).getByLabelText('Límite diario'), { target: { value: '80' } })
    fireEvent.click(within(ebay).getByRole('button', { name: 'Guardar límites' }))
    await waitFor(() => expect(api.cambiarParametros).toHaveBeenCalledWith('EBAY', { pausaSegundos: 10, limiteDiario: 80 }))
  })

  it('el Asistente Logístico solo ve el estado, sin cuenta ni botones', async () => {
    await renderPagina('ASISTENTE_LOGISTICO')
    await screen.findAllByRole('region')
    expect(screen.queryByLabelText('Contraseña')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Probar sesión' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Activar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reglas de extracción' })).toBeNull()
    expect(within(tarjeta('eBay')).getByText('Con error')).toBeTruthy()
  })

  it('si el servicio no responde muestra un error claro', async () => {
    api.listarFuentes.mockRejectedValue(new Error('caído'))
    await renderPagina()
    expect(await screen.findByText(/No se pudieron cargar las fuentes/)).toBeTruthy()
  })
})
