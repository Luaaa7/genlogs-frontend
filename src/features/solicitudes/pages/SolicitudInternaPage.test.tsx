import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { solicitudesInternasApi } from '../api/solicitudesInternasApi'
import { SolicitudInternaPage } from './SolicitudInternaPage'

function pintar(id: number, rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[`/solicitudes/${id}`]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<SolicitudInternaPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const boton = (nombre: string) => screen.queryByRole('button', { name: nombre })

describe('SolicitudInternaPage', () => {
  beforeEach(() => useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' }))
  afterEach(() => vi.restoreAllMocks())

  it('Iniciar revisión solo en PENDIENTE, y Sin asignar si no hay responsable', () => {
    const primera = pintar(1, 'ASISTENTE_LOGISTICO')
    expect(boton('Iniciar revisión')).toBeTruthy()
    expect(boton('Reanudar')).toBeNull()
    expect(screen.getByText('Sin asignar')).toBeTruthy()
    primera.unmount()
    pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Iniciar revisión')).toBeNull()
  })

  it('Reanudar solo en espera de tercero, y muestra motivo y fecha', () => {
    const primera = pintar(3, 'ASISTENTE_LOGISTICO')
    expect(boton('Reanudar')).toBeTruthy()
    expect(boton('Iniciar revisión')).toBeNull()
    expect(screen.getByText('Esperando respuesta del proveedor')).toBeTruthy()
    expect(screen.getByText('Pausada')).toBeTruthy()
    primera.unmount()
    pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Reanudar')).toBeNull()
  })

  it('la segunda reclasificación se deshabilita para el asistente y no para el Jefe', () => {
    const primera = pintar(4, 'ASISTENTE_LOGISTICO')
    expect((boton('Reclasificar') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('La segunda reclasificación la aprueba el Jefe Administrativo')).toBeTruthy()
    primera.unmount()
    pintar(4, 'JEFE_ADMINISTRATIVO')
    expect((boton('Reclasificar') as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText('La segunda reclasificación la aprueba el Jefe Administrativo')).toBeNull()
  })

  it('Reasignar solo se renderiza para el Jefe', () => {
    const primera = pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Reasignar')).toBeNull()
    primera.unmount()
    pintar(2, 'JEFE_ADMINISTRATIVO')
    expect(boton('Reasignar')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Ana López' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: 'Carmen Conta' })).toBeNull()
  })

  it('el Gerente no ve botones de acción', () => {
    pintar(2, 'GERENTE_GENERAL')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('SOL-002')).toBeTruthy()
  })

  it('COTIZADA queda en solo lectura', () => {
    pintar(5, 'JEFE_ADMINISTRATIVO')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('sin fila conocida pide abrirla desde la lista', () => {
    pintar(99, 'JEFE_ADMINISTRATIVO')
    expect(screen.getByText('Abre la solicitud desde la lista')).toBeTruthy()
  })

  it('la fecha estimada pasada no se envía', () => {
    const pausar = vi.spyOn(solicitudesInternasApi, 'pausar')
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Pausar')!)
    fireEvent.change(screen.getByLabelText('Fecha estimada'), { target: { value: '2000-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Esperando datos del cliente' }))
    expect(screen.getByRole('alert').textContent).toMatch(/no puede ser pasada/)
    expect(pausar).not.toHaveBeenCalled()
  })

  it('Otro exige un motivo y el campo no pasa de 40', () => {
    const pausar = vi.spyOn(solicitudesInternasApi, 'pausar')
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Pausar')!)
    fireEvent.click(screen.getByRole('button', { name: 'Otro' }))
    const motivo = screen.getByLabelText('Motivo')
    expect(motivo.getAttribute('maxLength')).toBe('40')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pausa' }))
    expect(screen.getByRole('alert').textContent).toMatch(/obligatorio/)
    expect(pausar).not.toHaveBeenCalled()
  })

  it('el historial pinta un movimiento con usuario null y el más reciente arriba', async () => {
    pintar(2, 'GERENTE_GENERAL')
    expect(await screen.findByText('CREADA')).toBeTruthy()
    const items = screen.getAllByRole('listitem')
    expect(items[0].textContent).toContain('Ana López')
    expect(items[1].textContent).toContain('CREADA')
    expect(items[1].textContent).not.toContain('Ana')
  })

  it('un 409 muestra el mensaje literal del backend', async () => {
    const error = new axios.AxiosError('conflicto')
    error.response = { status: 409, data: { message: 'La segunda reclasificación solo la hace el Jefe' }, statusText: 'Conflict', headers: {}, config: {} as never }
    vi.spyOn(solicitudesInternasApi, 'reclasificar').mockRejectedValueOnce(error)
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Reclasificar')!)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('La segunda reclasificación solo la hace el Jefe')).toBeTruthy()
  })
})
