import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const api = vi.hoisted(() => ({
  listarSelectores: vi.fn(),
  guardarSelectores: vi.fn(),
}))
vi.mock('@/api/fuentesApi', () => api)

import { ReglasExtraccion } from './ReglasExtraccion'

async function abrir() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><ReglasExtraccion codigo="EBAY" nombre="eBay" /></QueryClientProvider>)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Reglas de extracción' }))
  return screen.findByRole('form', { name: 'Reglas de extracción de eBay' })
}

const campo = (zona: HTMLElement, nombre: string) => within(zona).getByLabelText(nombre) as HTMLInputElement

describe('Editor de reglas de extracción (M4, BPMN 9-A)', () => {
  beforeEach(() => {
    api.listarSelectores.mockReset().mockResolvedValue([
      { pagina: 'BUSQUEDA', campo: 'ITEM', regla: 'li.s-item' },
      { pagina: 'BUSQUEDA', campo: 'PRECIO', regla: '.s-item__price' },
    ])
    api.guardarSelectores.mockReset().mockResolvedValue(undefined)
  })

  it('está cerrado al inicio y al abrirlo muestra las reglas guardadas de la tienda', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () => {
      render(<QueryClientProvider client={qc}><ReglasExtraccion codigo="EBAY" nombre="eBay" /></QueryClientProvider>)
    })
    expect(screen.queryByRole('form')).toBeNull()
    expect(api.listarSelectores).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Reglas de extracción' }))
    const form = await screen.findByRole('form', { name: 'Reglas de extracción de eBay' })
    const busqueda = within(form).getByRole('group', { name: 'Página de búsqueda' })
    await waitFor(() => expect(campo(busqueda, 'Bloque de cada resultado').value).toBe('li.s-item'))
    expect(campo(busqueda, 'Precio').value).toBe('.s-item__price')
    expect(campo(busqueda, 'Nombre').value).toBe('')
    expect(api.listarSelectores).toHaveBeenCalledWith('EBAY')
  })

  it('el bloque de cada resultado (ITEM) solo existe en la página de búsqueda', async () => {
    const form = await abrir()
    const ficha = within(form).getByRole('group', { name: 'Ficha del producto' })
    expect(within(ficha).queryByLabelText('Bloque de cada resultado')).toBeNull()
    expect(within(ficha).getByLabelText('Precio')).toBeTruthy()
  })

  it('guarda solo las reglas nuevas o cambiadas', async () => {
    const form = await abrir()
    const busqueda = within(form).getByRole('group', { name: 'Página de búsqueda' })
    await waitFor(() => expect(campo(busqueda, 'Precio').value).toBe('.s-item__price'))

    fireEvent.change(campo(busqueda, 'Precio'), { target: { value: '  .x-price  ' } })
    fireEvent.change(campo(busqueda, 'Nombre'), { target: { value: '.s-item__title' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar reglas' }))

    await waitFor(() => expect(api.guardarSelectores).toHaveBeenCalledWith('EBAY', [
      { pagina: 'BUSQUEDA', campo: 'NOMBRE', regla: '.s-item__title' },
      { pagina: 'BUSQUEDA', campo: 'PRECIO', regla: '.x-price' },
    ]))
  })

  it('no deja vaciar una regla ya guardada', async () => {
    const form = await abrir()
    const busqueda = within(form).getByRole('group', { name: 'Página de búsqueda' })
    await waitFor(() => expect(campo(busqueda, 'Precio').value).toBe('.s-item__price'))

    fireEvent.change(campo(busqueda, 'Precio'), { target: { value: '' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar reglas' }))

    expect(await within(form).findByText(/no se puede dejar vacía/)).toBeTruthy()
    expect(api.guardarSelectores).not.toHaveBeenCalled()
  })

  it('sin cambios no envía nada', async () => {
    const form = await abrir()
    await waitFor(() => expect(api.listarSelectores).toHaveBeenCalled())
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar reglas' }))
    expect(await within(form).findByText(/No hay cambios/)).toBeTruthy()
    expect(api.guardarSelectores).not.toHaveBeenCalled()
  })

  it('una regla de más de 1000 caracteres no se envía', async () => {
    const form = await abrir()
    const ficha = within(form).getByRole('group', { name: 'Ficha del producto' })
    fireEvent.change(campo(ficha, 'Nombre'), { target: { value: 'a'.repeat(1001) } })
    fireEvent.click(within(form).getByRole('button', { name: 'Guardar reglas' }))
    expect(await within(form).findByText(/1000 caracteres/)).toBeTruthy()
    expect(api.guardarSelectores).not.toHaveBeenCalled()
  })
})
