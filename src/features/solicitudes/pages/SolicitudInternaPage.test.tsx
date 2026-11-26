import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { useAuthStore } from '@/features/auth/store/authStore'
import { solicitudesInternasApi } from '../api/solicitudesInternasApi'
import { SolicitudInternaPage } from './SolicitudInternaPage'

const api = vi.hoisted(() => ({ listarUsuarios: vi.fn() }))
vi.mock('@/api/usuariosApi', () => api)

const USUARIOS = [
  { idUsuario: 7, nombreUsuario: 'alopez', nombres: 'Ana López', correo: 'ana@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: false },
  { idUsuario: 3, nombreUsuario: 'jperez', nombres: 'Juan Pérez', correo: 'juan@genlogs.pe', nombreRol: 'JEFE_ADMINISTRATIVO', bloqueado: false },
  { idUsuario: 8, nombreUsuario: 'mora', nombres: 'Luis Mora', correo: 'luis@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: true },
  { idUsuario: 4, nombreUsuario: 'conta', nombres: 'Carmen Conta', correo: 'carmen@genlogs.pe', nombreRol: 'CONTADOR_GENERAL', bloqueado: false },
]

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

/** Respuesta simulada: el mock real guarda cambios entre pruebas y movería de estado las solicitudes de ejemplo. */
const respuesta = (idSolicitud: number, estado: SolicitudInternaResponse['estado']): SolicitudInternaResponse => ({
  idSolicitud, codigoSolicitud: `SOL-00${idSolicitud}`, asunto: 'Prueba', cliente: 'Minera Sur', estado, tipoPlazo: 'COMUN',
  fechaRecepcion: '2026-11-10T09:00:00', fechaLimiteInterna: null, pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null,
  reclasificaciones: 0, asignado: null,
})

const boton = (nombre: string) => screen.queryByRole('button', { name: nombre })

describe('SolicitudInternaPage', () => {
  beforeEach(() => {
    api.listarUsuarios.mockReset()
    api.listarUsuarios.mockResolvedValue(USUARIOS)
    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('en Recibida el botón principal dice «Empezar a buscar el producto», y Sin asignar si no hay responsable', () => {
    const primera = pintar(1, 'ASISTENTE_LOGISTICO')
    expect(boton('Empezar a buscar el producto')).toBeTruthy()
    expect(boton('Iniciar revisión')).toBeNull()
    expect(boton('Proveedor respondió')).toBeNull()
    expect(screen.getByText('Sin asignar')).toBeTruthy()
    primera.unmount()
    pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Empezar a buscar el producto')).toBeNull()
  })

  it('en espera de proveedor el botón para continuar dice «Proveedor respondió», y muestra motivo y fecha', () => {
    const primera = pintar(3, 'ASISTENTE_LOGISTICO')
    expect(boton('Proveedor respondió')).toBeTruthy()
    expect(boton('Reanudar')).toBeNull()
    expect(boton('Empezar a buscar el producto')).toBeNull()
    expect(screen.getByText('Esperando respuesta del proveedor')).toBeTruthy()
    expect(screen.getByText('Pausada')).toBeTruthy()
    primera.unmount()
    pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Proveedor respondió')).toBeNull()
  })

  it('los estados se llaman Recibida, En búsqueda y En espera de proveedor', () => {
    const a = pintar(1, 'GERENTE_GENERAL')
    expect(screen.getByText('Recibida')).toBeTruthy()
    a.unmount()
    const b = pintar(2, 'GERENTE_GENERAL')
    expect(screen.getByText('En búsqueda')).toBeTruthy()
    b.unmount()
    pintar(3, 'GERENTE_GENERAL')
    expect(screen.getByText('En espera de proveedor')).toBeTruthy()
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

  it('Reasignar solo se renderiza para el Jefe, con el personal real', async () => {
    const primera = pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Reasignar')).toBeNull()
    expect(api.listarUsuarios).not.toHaveBeenCalled()
    primera.unmount()
    pintar(2, 'JEFE_ADMINISTRATIVO')
    expect(boton('Reasignar')).toBeTruthy()
    expect(await screen.findByRole('option', { name: 'Ana López' })).toBeTruthy()
    expect(screen.queryByRole('option', { name: 'Carmen Conta' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'Luis Mora' })).toBeNull()
    expect(api.listarUsuarios).toHaveBeenCalledTimes(1)
  })

  it('el Asistente Administrativo ve el detalle pero sin botones de acción', () => {
    pintar(2, 'ASISTENTE_ADMINISTRATIVO')
    expect(screen.getByRole('heading', { name: 'SOL-002' })).toBeTruthy()
    expect(boton('Reasignar')).toBeNull()
    expect(boton('Empezar a buscar el producto')).toBeNull()
    expect(boton('Reclasificar')).toBeNull()
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

  it('sin fila conocida la pide por su número y, si no existe, lo dice', async () => {
    pintar(99, 'JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('No se encontró la solicitud')).toBeTruthy()
  })

  it('en En búsqueda el botón es «Proveedor contactado» y solo pide la fecha estimada de respuesta', () => {
    pintar(2, 'ASISTENTE_LOGISTICO')
    expect(boton('Pausar')).toBeNull()
    fireEvent.click(boton('Proveedor contactado')!)
    const grupo = screen.getByRole('group', { name: 'Proveedor contactado' })
    expect(within(grupo).getByLabelText('Fecha estimada de respuesta')).toBeTruthy()
    expect(within(grupo).queryAllByRole('textbox')).toHaveLength(0)
    for (const viejo of ['Esperando datos del cliente', 'Esperando confirmación de stock', 'Esperando documento de aduana', 'Otro']) {
      expect(screen.queryByRole('button', { name: viejo })).toBeNull()
    }
  })

  it('confirmar manda el único motivo de espera y la fecha, sin cambiar el contrato', async () => {
    const pausar = vi.spyOn(solicitudesInternasApi, 'pausar').mockResolvedValue(respuesta(2, 'EN_ESPERA_TERCERO'))
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Proveedor contactado')!)
    fireEvent.change(screen.getByLabelText('Fecha estimada de respuesta'), { target: { value: '2999-12-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(pausar).toHaveBeenCalledWith(2, { motivo: 'Esperando respuesta del proveedor', fechaEstimada: '2999-12-31' }))
  })

  it('la fecha es opcional: sin ella solo viaja el motivo', async () => {
    const pausar = vi.spyOn(solicitudesInternasApi, 'pausar').mockResolvedValue(respuesta(2, 'EN_ESPERA_TERCERO'))
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Proveedor contactado')!)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(pausar).toHaveBeenCalledWith(2, { motivo: 'Esperando respuesta del proveedor' }))
  })

  it('la fecha estimada pasada no se envía', () => {
    const pausar = vi.spyOn(solicitudesInternasApi, 'pausar')
    pintar(2, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Proveedor contactado')!)
    fireEvent.change(screen.getByLabelText('Fecha estimada de respuesta'), { target: { value: '2000-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(screen.getByRole('alert').textContent).toMatch(/no puede ser pasada/)
    expect(pausar).not.toHaveBeenCalled()
  })

  it('«Proveedor respondió» reanuda la búsqueda con la llamada de siempre', async () => {
    const reanudar = vi.spyOn(solicitudesInternasApi, 'reanudar').mockResolvedValue(respuesta(3, 'EN_REVISION'))
    pintar(3, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Proveedor respondió')!)
    await waitFor(() => expect(reanudar).toHaveBeenCalledWith(3))
  })

  it('«Empezar a buscar el producto» inicia con la llamada de siempre', async () => {
    const iniciar = vi.spyOn(solicitudesInternasApi, 'iniciar').mockResolvedValue(respuesta(1, 'EN_REVISION'))
    pintar(1, 'ASISTENTE_LOGISTICO')
    fireEvent.click(boton('Empezar a buscar el producto')!)
    await waitFor(() => expect(iniciar).toHaveBeenCalledWith(1))
  })

  describe('clasificación de plazo', () => {
    it('en Recibida no se ven «Tipo de plazo» ni «Reclasificar»', () => {
      pintar(1, 'JEFE_ADMINISTRATIVO')
      expect(screen.queryByLabelText('Tipo de plazo')).toBeNull()
      expect(boton('Reclasificar')).toBeNull()
    })

    it('desde En búsqueda reaparecen', () => {
      const a = pintar(2, 'ASISTENTE_LOGISTICO')
      expect(screen.getByLabelText('Tipo de plazo')).toBeTruthy()
      expect(boton('Reclasificar')).toBeTruthy()
      a.unmount()
      pintar(3, 'ASISTENTE_LOGISTICO')
      expect(screen.getByLabelText('Tipo de plazo')).toBeTruthy()
    })
  })

  describe('ítems y buscadores externos', () => {
    it('en En búsqueda cada ítem trae sus buscadores externos', async () => {
      pintar(2, 'ASISTENTE_LOGISTICO')
      const enlace = (await screen.findAllByRole('link', { name: /Buscar .* en Google/ }))[0]
      expect(enlace.getAttribute('target')).toBe('_blank')
      expect(enlace.getAttribute('rel')).toBe('noopener noreferrer')
      expect(screen.getAllByRole('link', { name: /en eBay/ }).length).toBeGreaterThan(0)
    })

    it('en Recibida y en espera de proveedor se ven los ítems pero sin buscadores', async () => {
      const a = pintar(1, 'ASISTENTE_LOGISTICO')
      expect(await screen.findByText('Ítems de la solicitud')).toBeTruthy()
      expect(await screen.findByText('Filtro de aire 1R-0750')).toBeTruthy()
      expect(screen.queryByRole('link', { name: /en Google/ })).toBeNull()
      a.unmount()
      pintar(3, 'ASISTENTE_LOGISTICO')
      await screen.findByText('Filtro de aire 1R-0750')
      expect(screen.queryByRole('link', { name: /en Google/ })).toBeNull()
    })

    it('si falla la carga de ítems avisa sin tumbar la pantalla', async () => {
      vi.spyOn(solicitudesInternasApi, 'items').mockRejectedValue(new Error('500'))
      pintar(2, 'ASISTENTE_LOGISTICO')
      expect(await screen.findByText(/No se pudieron cargar los ítems/)).toBeTruthy()
      expect(screen.getByText('SOL-002')).toBeTruthy()
    })
  })

  it('el historial pinta un movimiento con usuario null y el más reciente arriba', async () => {
    pintar(2, 'GERENTE_GENERAL')
    expect(await screen.findByText('CREADA')).toBeTruthy()
    const items = within(screen.getByRole('region', { name: 'Historial' })).getAllByRole('listitem')
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
