import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
    aciertosPrueba: null, tieneUsuario: false, tieneClave: false, reglasFaltantes: [], ...parcial,
  }
}

async function renderPagina(rol = 'JEFE_ADMINISTRATIVO', url = '/configuracion/fuentes') {
  useAuthStore.getState().login('token', 'usuario', rol)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/configuracion/fuentes', element: <FuentesBusquedaPage /> }], { initialEntries: [url] })
  await act(async () => {
    render(<QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider>)
  })
  return router
}

const tarjeta = (nombre: string) => screen.getByRole('region', { name: nombre })
const boton = (zona: HTMLElement, nombre: string) => within(zona).getByRole('button', { name: nombre }) as HTMLButtonElement

describe('Configuración > Fuentes de búsqueda (L2, BPMN 9-A)', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarFuentes.mockResolvedValue([
      fuente({ codigo: 'MERCADO_LIBRE', nombre: 'Mercado Libre' }),
      fuente({
        codigo: 'SIN_REGLAS',
        nombre: 'Tienda sin reglas',
        estado: 'CON_ERROR',
        tieneUsuario: true,
        tieneClave: true,
        ultimoError: 'Mercado Libre: faltan reglas de la página de inicio de sesión (casilla del usuario, casilla de la clave, botón para ingresar y señal de sesión iniciada) en Configuración > Fuentes > Reglas de extracción.',
      }),
      fuente({ codigo: 'EBAY', nombre: 'eBay', estado: 'CON_ERROR', ultimoError: 'La tienda bloqueó la lectura.', tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'OTRA', nombre: 'Otra tienda', estado: 'ACTIVA', aciertosPrueba: 3, tieneUsuario: true, tieneClave: true }),
      // v3.4: el backend todavía la envía, pero la pantalla no la muestra.
      fuente({ codigo: 'AMAZON', nombre: 'Amazon', estado: 'CON_ERROR', tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'ALIEXPRESS', nombre: 'AliExpress', estado: 'ACTIVA', aciertosPrueba: 6, tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'ALIBABA', nombre: 'Alibaba', estado: 'REQUIERE_VERIFICACION', ultimoError: 'La tienda pidió un código.' }),
    ])
    api.guardarCredenciales.mockResolvedValue(undefined)
    api.activarFuente.mockResolvedValue(undefined)
    api.cambiarParametros.mockResolvedValue(undefined)
  })

  it('muestra una tarjeta por tienda con su estado en palabras y el último error', async () => {
    await renderPagina()
    expect(await screen.findAllByRole('region')).toHaveLength(6)
    const libre = tarjeta('Mercado Libre')
    expect(within(libre).getByText('Sin configurar')).toBeTruthy()
    expect(within(libre).getByText('Falta la cuenta de búsqueda.')).toBeTruthy()
    expect(within(libre).queryByText('Sin probar')).toBeNull()
    const sinReglas = tarjeta('Tienda sin reglas')
    expect(within(sinReglas).getByText('Sin configurar')).toBeTruthy()
    expect(within(sinReglas).getByText('Faltan las reglas de la página de inicio de sesión.')).toBeTruthy()
    expect(within(sinReglas).queryByText('Con error')).toBeNull()
    expect(within(tarjeta('eBay')).getByText('Con error')).toBeTruthy()
    expect(within(tarjeta('eBay')).getByText('La tienda bloqueó la lectura.')).toBeTruthy()
    expect(within(tarjeta('Alibaba')).getByText('Requiere verificación')).toBeTruthy()
    expect(within(tarjeta('AliExpress')).getByText('6 de 10')).toBeTruthy()
  })

  it('Amazon no aparece: bloquea el acceso automatizado y se usa a mano (v3.4)', async () => {
    await renderPagina()
    await screen.findAllByRole('region')
    expect(screen.queryByRole('region', { name: 'Amazon' })).toBeNull()
    expect(screen.queryByText('Amazon')).toBeNull()
  })

  it('con reglasFaltantes muestra «Sin configurar» con lo que falta, aunque la base diga Con error (EF2/EF3)', async () => {
    api.listarFuentes.mockResolvedValue([
      fuente({
        codigo: 'EBAY', nombre: 'eBay', estado: 'CON_ERROR', tieneUsuario: true, tieneClave: true,
        ultimoError: 'eBay: faltan reglas para buscar.', reglasFaltantes: ['PRECIO', 'ENLACE'],
      }),
      fuente({
        codigo: 'ALIBABA', nombre: 'Alibaba', estado: 'SIN_PROBAR', tieneUsuario: true, tieneClave: true,
        reglasFaltantes: ['ENVIAR', 'EXITO'],
      }),
    ])
    await renderPagina()
    const ebay = await screen.findByRole('region', { name: 'eBay' })
    expect(within(ebay).getByText('Sin configurar')).toBeTruthy()
    expect(within(ebay).getByText('Faltan reglas de búsqueda: precio y enlace.')).toBeTruthy()
    expect(within(ebay).queryByText('Con error')).toBeNull()
    expect(within(ebay).queryByText('eBay: faltan reglas para buscar.')).toBeNull()
    const alibaba = tarjeta('Alibaba')
    expect(within(alibaba).getByText('Faltan reglas de ingreso: botón para ingresar y señal de sesión iniciada.')).toBeTruthy()
  })

  it('el Asistente Logístico también ve qué reglas faltan', async () => {
    api.listarFuentes.mockResolvedValue([
      fuente({ codigo: 'EBAY', nombre: 'eBay', estado: 'CON_ERROR', tieneUsuario: true, tieneClave: true, reglasFaltantes: ['ITEM'] }),
    ])
    await renderPagina('ASISTENTE_LOGISTICO')
    const ebay = await screen.findByRole('region', { name: 'eBay' })
    expect(within(ebay).getByText('Sin configurar')).toBeTruthy()
    expect(within(ebay).getByText('Faltan reglas de búsqueda: bloque de cada resultado.')).toBeTruthy()
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
    expect(boton(tarjeta('Otra tienda'), 'Activar').disabled).toBe(true)
    expect(within(tarjeta('Otra tienda')).getByText(/4 o más aciertos/)).toBeTruthy()
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

describe('Configuración > Fuentes: ?fuente= resalta la tienda del aviso', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.listarFuentes.mockResolvedValue([
      fuente({ codigo: 'MERCADO_LIBRE', nombre: 'Mercado Libre' }),
      fuente({ codigo: 'EBAY', nombre: 'eBay', estado: 'CON_ERROR', ultimoError: 'La tienda bloqueó la lectura.', tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'ALIBABA', nombre: 'Alibaba', estado: 'ACTIVA', tieneUsuario: true, tieneClave: true }),
      fuente({ codigo: 'AMAZON', nombre: 'Amazon', estado: 'CON_ERROR', tieneUsuario: true, tieneClave: true }),
    ])
  })

  const resaltadas = () => screen.getAllByRole('region').filter((r) => r.getAttribute('aria-current') === 'true')

  it('sin el parámetro no resalta ninguna tienda', async () => {
    await renderPagina()
    await screen.findByRole('region', { name: 'eBay' })
    expect(resaltadas()).toHaveLength(0)
  })

  it('resalta solo la tienda del código y le pone el foco', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO', '/configuracion/fuentes?fuente=EBAY')
    const ebay = await screen.findByRole('region', { name: 'eBay' })
    expect(ebay.getAttribute('aria-current')).toBe('true')
    expect(resaltadas()).toEqual([ebay])
    expect(document.activeElement).toBe(ebay)
  })

  it('acepta el código en minúsculas y con otros parámetros en la URL', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO', '/configuracion/fuentes?orden=1&fuente=mercado_libre')
    const ml = await screen.findByRole('region', { name: 'Mercado Libre' })
    expect(resaltadas()).toEqual([ml])
  })

  it('un código que no existe no resalta nada ni rompe la página', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO', '/configuracion/fuentes?fuente=NO_EXISTE')
    await screen.findByRole('region', { name: 'Alibaba' })
    expect(resaltadas()).toHaveLength(0)
  })

  it('?fuente=AMAZON no resalta nada: Amazon ya no se muestra (v3.4)', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO', '/configuracion/fuentes?fuente=AMAZON')
    await screen.findByRole('region', { name: 'Alibaba' })
    expect(screen.queryByRole('region', { name: 'Amazon' })).toBeNull()
    expect(resaltadas()).toHaveLength(0)
  })

  it('también resalta para quien solo ve (Asistente Logístico)', async () => {
    await renderPagina('ASISTENTE_LOGISTICO', '/configuracion/fuentes?fuente=ALIBABA')
    const alibaba = await screen.findByRole('region', { name: 'Alibaba' })
    expect(resaltadas()).toEqual([alibaba])
  })

  it('al navegar a otro ?fuente= cambia la tienda resaltada (y al recargar se conserva por la URL)', async () => {
    const router = await renderPagina('JEFE_ADMINISTRATIVO', '/configuracion/fuentes?fuente=EBAY')
    await screen.findByRole('region', { name: 'eBay' })
    await act(async () => { await router.navigate('/configuracion/fuentes?fuente=ALIBABA') })
    await waitFor(() => expect(resaltadas()).toEqual([screen.getByRole('region', { name: 'Alibaba' })]))
    expect(router.state.location.search).toBe('?fuente=ALIBABA')
  })
})
