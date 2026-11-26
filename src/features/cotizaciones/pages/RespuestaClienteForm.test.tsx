import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AxiosError, type AxiosResponse } from 'axios'
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

function errorHttp(status: number, message: string) {
  return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse)
}

let cabecera: Record<string, unknown>
let seguimientos: Record<string, unknown>[]
let ordenes: Record<string, unknown>[]
let tipoDocCliente: string

function ordenInterna(parcial: Record<string, unknown> = {}) {
  return {
    idOrdenCompra: 15,
    idCotizacion: 1,
    idEstadoOrdenCompra: 1,
    idCondicionPago: 2,
    numeroOrdenCompra: '0032-10',
    estadoCodigo: 'RECIBIDA',
    numeroOcCliente: null,
    montoOcCliente: null,
    fechaEmisionCliente: null,
    fechaRecepcion: '2026-11-20',
    total: 118,
    moneda: 'PEN',
    ...parcial,
  }
}

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

async function cargar() {
  expect(await screen.findByText('COT-001')).toBeTruthy()
}

async function abrir(nombre: string) {
  await cargar()
  fireEvent.click(screen.getByRole('button', { name: nombre }))
  expect(await screen.findByRole('heading', { name: 'Registrar respuesta del cliente' })).toBeTruthy()
}

function completar(fecha = diaLima(-1), medio = 'correo', nota = '') {
  fireEvent.change(screen.getByLabelText(/Fecha de la respuesta/), { target: { value: fecha } })
  fireEvent.change(screen.getByLabelText(/^Medio/), { target: { value: medio } })
  if (nota) fireEvent.change(screen.getByLabelText(/^Nota/), { target: { value: nota } })
}

const precarga = {
  idCotizacion: 1,
  codigoCotizacion: 'COT-001',
  idCliente: 4,
  cliente: 'Minera Sur',
  moneda: 'PEN',
  idCondicionPago: 2,
  subtotal: 100,
  igv: 18,
  total: 118,
  items: [{ idCotizacionDetalle: 7, descripcion: 'Filtro de aceite', cantidad: 2, unidad: 'und', precioUnitario: 50, importe: 100 }],
}

describe('respuesta del cliente en el detalle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seguimientos = []
    ordenes = []
    tipoDocCliente = 'RUC'
    cabecera = {
      idCotizacion: 1, idCliente: 4, codigoCotizacion: 'COT-001', estado: 'ENVIADA',
      fechaCotizacion: '2026-11-10', fechaValidez: diaLima(10), condicionPago: 'CONTADO',
      moneda: 'PEN', clienteRazonSocial: 'Minera Sur', subtotal: 100, igv: 18, total: 118,
    }
    http.get.mockImplementation((url: string) => {
      if (url === '/clientes/4') return Promise.resolve({ data: { idCliente: 4, tipoDocumento: tipoDocCliente, numeroDocumento: '10456789', razonSocial: 'Minera Sur', situacion: 'ACTIVO', esTambienProveedor: false } })
      if (url === '/cotizaciones/1') return Promise.resolve({ data: cabecera })
      if (url.endsWith('/adjuntos')) return Promise.resolve({ data: [] })
      if (url.endsWith('/seguimiento')) return Promise.resolve({ data: seguimientos })
      if (url.endsWith('/lineas')) return Promise.resolve({ data: [] })
      if (url.includes('/desde-cotizacion/')) return Promise.resolve({ data: precarga })
      if (url.startsWith('/ordenes-compra')) return Promise.resolve({ data: { content: ordenes } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.post.mockResolvedValue({ data: { cotizacion: cabecera } })
  })

  it('el vendedor y el jefe ven las tres respuestas en enviada y en negociación', async () => {
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect(screen.getByRole('button', { name: 'Cliente aceptó' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pidió cambios' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Rechazó' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Marcar como enviada' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
  })

  it('en negociación el jefe también las ve', async () => {
    cabecera = { ...cabecera, estado: 'EN_NEGOCIACION' }
    pintar('JEFE_ADMINISTRATIVO')
    await cargar()
    expect(screen.getByRole('button', { name: 'Cliente aceptó' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Pasar a negociación' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Pidió cambios' })).toBeTruthy()
  })

  it('el administrativo y el gerente no ven los botones', async () => {
    pintar('ASISTENTE_ADMINISTRATIVO')
    await cargar()
    expect(screen.queryByRole('button', { name: 'Cliente aceptó' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Pidió cambios' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rechazó' })).toBeNull()
  })

  it('en borrador no hay botones de respuesta', async () => {
    cabecera = { ...cabecera, estado: 'BORRADOR' }
    pintar('JEFE_ADMINISTRATIVO')
    await cargar()
    expect(screen.queryByRole('button', { name: 'Cliente aceptó' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Marcar como enviada' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
  })

  it('aprobada por el Jefe se distingue y ofrece marcar como enviada', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    const etiqueta = screen.getByRole('heading', { name: 'COT-001' }).parentElement?.textContent ?? ''
    expect(etiqueta).toContain('Aprobada por el Jefe')
    expect(etiqueta).not.toContain('Aceptada por el cliente')
    expect(screen.getByRole('button', { name: 'Marcar como enviada' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cliente aceptó' })).toBeNull()
  })

  it('marcar como enviada llama a marcar-enviada, muestra Enviando y recarga Enviada', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    let resolver: (valor: unknown) => void = () => {}
    http.post.mockImplementation((url: string) => {
      if (url === '/cotizaciones/1/marcar-enviada') {
        return new Promise((resolve) => {
          resolver = resolve
        })
      }
      return Promise.resolve({ data: {} })
    })
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como enviada' }))
    expect(await screen.findByRole('button', { name: 'Enviando…' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Enviar Cotización' })).toBeNull()
    cabecera = { ...cabecera, estado: 'ENVIADA' }
    resolver({ data: cabecera })
    const encabezado = screen.getByRole('heading', { name: 'COT-001' }).parentElement
    await waitFor(() => expect(encabezado?.textContent).toContain('Enviada'))
    expect(encabezado?.textContent).not.toContain('Aprobada por el Jefe')
    expect(screen.queryByRole('button', { name: 'Marcar como enviada' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Enviando…' })).toBeNull()
    expect(http.post.mock.calls.map((llamada) => llamada[0])).toEqual(['/cotizaciones/1/marcar-enviada'])
  })

  it('un 400 al marcar como enviada muestra el mensaje y no la deja enviada', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    http.post.mockRejectedValue(errorHttp(400, 'El cliente no tiene un correo para enviar la cotización.'))
    pintar('JEFE_ADMINISTRATIVO')
    await cargar()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como enviada' }))
    expect(await screen.findByText('El cliente no tiene un correo para enviar la cotización.')).toBeTruthy()
    const encabezado = screen.getByRole('heading', { name: 'COT-001' }).parentElement
    expect(encabezado?.textContent).toContain('Aprobada por el Jefe')
    expect(screen.getByRole('button', { name: 'Marcar como enviada' })).toBeTruthy()
  })

  it('un 409 al marcar como enviada muestra el mensaje del backend', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    http.post.mockRejectedValue(errorHttp(409, 'Solo se marca como enviada una cotización aprobada por el Jefe. Ahora está en Enviada.'))
    pintar('JEFE_ADMINISTRATIVO')
    await cargar()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como enviada' }))
    expect(await screen.findByText('Solo se marca como enviada una cotización aprobada por el Jefe. Ahora está en Enviada.')).toBeTruthy()
    const encabezado = screen.getByRole('heading', { name: 'COT-001' }).parentElement
    expect(encabezado?.textContent).toContain('Aprobada por el Jefe')
    expect(screen.getByRole('button', { name: 'Marcar como enviada' })).toBeTruthy()
  })

  it('el gerente no marca como enviada', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    pintar('GERENTE_GENERAL')
    await cargar()
    expect(screen.queryByRole('button', { name: 'Marcar como enviada' })).toBeNull()
  })

  it('aceptada por el cliente se distingue y abre la orden', async () => {
    cabecera = { ...cabecera, estado: 'ACEPTADA_CLIENTE' }
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    const etiqueta = screen.getByRole('heading', { name: 'COT-001' }).parentElement?.textContent ?? ''
    expect(etiqueta).toContain('Aceptada por el cliente')
    expect(etiqueta).not.toContain('Aprobada por el Jefe')
    fireEvent.click(await screen.findByRole('button', { name: 'Registrar orden de compra' }))
    expect(await screen.findByText(/Filtro de aceite/)).toBeTruthy()
    expect(screen.getByText('Cotización de origen COT-001.')).toBeTruthy()
    expect(screen.getByText('PEN')).toBeTruthy()
  })

  it('una fecha futura no se envía', async () => {
    pintar('ASISTENTE_LOGISTICO')
    await abrir('Cliente aceptó')
    const fecha = screen.getByLabelText(/Fecha de la respuesta/) as HTMLInputElement
    fecha.removeAttribute('max')
    completar('2099-01-01', 'correo', 'Aceptó')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('La fecha de respuesta no puede ser futura')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('la etiqueta es «Nota *» con el mismo asterisco rojo de Fecha y Medio, en las tres respuestas', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    for (const nombre of ['Cliente aceptó', 'Pidió cambios', 'Rechazó']) {
      await abrir(nombre)
      const etiqueta = screen.getByText(/^Nota/, { selector: 'label' })
      expect(etiqueta.textContent?.startsWith('Nota *')).toBe(true)
      expect(etiqueta.textContent).not.toMatch(/adjunto/i)
      const asterisco = etiqueta.querySelector('span')
      expect(asterisco?.textContent).toBe('*')
      expect(asterisco?.className).toBe(screen.getByLabelText(/Fecha de la respuesta/).closest('label')?.querySelector('span')?.className)
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    }
  })

  it('aceptó sin nota no llama al endpoint', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Cliente aceptó')
    completar()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('La nota es obligatoria: escribe qué confirmó el cliente')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('aceptó con un adjunto válido pero sin nota tampoco se guarda: el adjunto no reemplaza la nota', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Cliente aceptó')
    completar()
    const archivo = new File(['pdf'], 'evidencia.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/Adjunto \(opcional/), { target: { files: [archivo] } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('La nota es obligatoria: escribe qué confirmó el cliente')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('una nota de solo espacios cuenta como vacía', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Cliente aceptó')
    completar()
    fireEvent.change(screen.getByLabelText(/^Nota/), { target: { value: '    ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('La nota es obligatoria: escribe qué confirmó el cliente')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('pidió cambios exige el motivo', async () => {
    pintar('ASISTENTE_LOGISTICO')
    await abrir('Pidió cambios')
    completar()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('Indica el motivo del cambio que pidió el cliente')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('rechazó exige el motivo', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Rechazó')
    completar()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('Indica el motivo del rechazo')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('un archivo que no es PDF, PNG o JPG no se envía', async () => {
    pintar('ASISTENTE_LOGISTICO')
    await abrir('Cliente aceptó')
    completar()
    const archivo = new File(['hola'], 'notas.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText(/Adjunto \(opcional/), { target: { files: [archivo] } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('El adjunto solo puede ser PDF, PNG o JPG')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('aceptó envía ACEPTADA_CLIENTE y no escribe APROBADA', async () => {
    pintar('ASISTENTE_LOGISTICO')
    await abrir('Cliente aceptó')
    const fecha = diaLima(-1)
    completar(fecha, 'whatsapp', '  Aceptó por WhatsApp  ')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', {
      codigoEstado: 'ACEPTADA_CLIENTE',
      comentario: 'Aceptó por WhatsApp',
      fechaRespuesta: fecha,
      medio: 'whatsapp',
    }))
    expect(JSON.stringify(http.post.mock.calls)).not.toContain('APROBADA')
    expect(http.post.mock.calls.map((llamada) => llamada[0])).toEqual(['/cotizaciones/1/respuesta-cliente'])
  })

  it('pidió cambios envía EN_NEGOCIACION', async () => {
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Pidió cambios')
    const fecha = diaLima(-1)
    completar(fecha, 'correo', 'Pidió otro plazo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', {
      codigoEstado: 'EN_NEGOCIACION',
      comentario: 'Pidió otro plazo',
      fechaRespuesta: fecha,
      medio: 'correo',
    }))
    expect(JSON.stringify(http.post.mock.calls)).not.toContain('APROBADA')
  })

  it('el adjunto se sube aparte y la respuesta manda su id', async () => {
    http.post.mockImplementation((url: string) => {
      if (String(url).endsWith('/adjuntos')) return Promise.resolve({ data: { idAdjunto: 9 } })
      return Promise.resolve({ data: cabecera })
    })
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Rechazó')
    const fecha = diaLima(-1)
    completar(fecha, 'correo', 'No les sirve el plazo')
    const archivo = new File(['pdf'], 'evidencia.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/Adjunto \(opcional/), { target: { files: [archivo] } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', {
      codigoEstado: 'RECHAZADA',
      comentario: 'No les sirve el plazo',
      fechaRespuesta: fecha,
      medio: 'correo',
      idAdjunto: 9,
    }))
    const destinos = http.post.mock.calls.map((llamada) => llamada[0])
    expect(destinos).toEqual(['/cotizaciones/1/adjuntos', '/cotizaciones/1/respuesta-cliente'])
    expect(http.post.mock.calls[0][1]).toBeInstanceOf(FormData)
    expect(JSON.stringify(http.post.mock.calls)).not.toContain('APROBADA')
  })

  it('un 403 muestra el mensaje del backend y deja el botón listo al terminar', async () => {
    let soltar: (error: unknown) => void = () => {}
    http.post.mockImplementation(() => new Promise((_resolver, reject) => { soltar = reject }))
    pintar('ASISTENTE_LOGISTICO')
    await abrir('Rechazó')
    completar(diaLima(-1), 'llamada', 'El precio no les cierra')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/respuesta-cliente', expect.objectContaining({
      codigoEstado: 'RECHAZADA',
    })))
    expect((await screen.findByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true)
    soltar(errorHttp(403, 'Solo el asistente logístico o el jefe administrativo pueden registrar esto'))
    expect(await screen.findByText('Solo el asistente logístico o el jefe administrativo pueden registrar esto')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Guardar respuesta' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('un 409 al registrar muestra el mensaje del backend', async () => {
    http.post.mockRejectedValue(errorHttp(409, 'La cotización ya no está enviada ni en negociación.'))
    pintar('JEFE_ADMINISTRATIVO')
    await abrir('Pidió cambios')
    completar(diaLima(-1), 'otro', 'Pidió otro plazo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar respuesta' }))
    expect(await screen.findByText('La cotización ya no está enviada ni en negociación.')).toBeTruthy()
  })

  it('el seguimiento muestra el cambio, el medio, la nota y el adjunto', async () => {
    seguimientos = [{
      idSeguimiento: 3,
      estadoAnterior: 'ENVIADA',
      estadoNuevo: 'ACEPTADA_CLIENTE',
      fechaEvento: '2026-11-18T15:30:00',
      fechaRespuesta: '2026-11-18',
      usuario: 'Ana',
      medio: 'correo',
      comentario: 'Confirmó por correo',
      rutaAdjunto: 'https://archivos.example/evidencia.pdf',
    }]
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect(screen.getByText('Enviada → Aceptada por el cliente')).toBeTruthy()
    expect(screen.getByText(/Ana/)).toBeTruthy()
    expect(screen.getByText(/Correo/)).toBeTruthy()
    expect(screen.getByText('Confirmó por correo')).toBeTruthy()
    expect(screen.getByText(/18\/11\/2026/)).toBeTruthy()
    const enlace = screen.getByRole('link', { name: 'Ver adjunto' })
    expect(enlace.getAttribute('href')).toBe('https://archivos.example/evidencia.pdf')
    expect(screen.queryByText('El cliente solicitó cambios')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Abrir esta versión' })).toBeNull()
  })

  it('la negociación del cliente abre esa versión y avisa el pedido de cambios', async () => {
    seguimientos = [{
      idSeguimiento: 4,
      estadoAnterior: 'ENVIADA',
      estadoNuevo: 'EN_NEGOCIACION',
      fechaEvento: '2026-11-19T10:00:00',
      fechaRespuesta: '2026-11-19',
      medio: 'whatsapp',
      comentario: 'Pidió otro plazo',
      rutaVersionPdf: 'https://archivos.example/cot-v2.pdf',
    }]
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect(screen.getByText('Enviada → En negociación')).toBeTruthy()
    expect(screen.getByText('El cliente solicitó cambios')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir esta versión' }))
    const marco = screen.getByTitle('Enviada → En negociación')
    expect(marco.getAttribute('src')).toBe('https://archivos.example/cot-v2.pdf')
    expect(marco.tagName).toBe('IFRAME')
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Ver adjunto' })).toBeNull()
  })

  it('aceptada con orden ya creada muestra esa orden y, si falta, la OC del cliente', async () => {
    cabecera = { ...cabecera, estado: 'ACEPTADA_CLIENTE' }
    ordenes = [ordenInterna()]
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect(await screen.findByRole('button', { name: 'Registrar OC del cliente' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
    const consulta = http.get.mock.calls.find((llamada) => llamada[0] === '/ordenes-compra')
    expect(consulta?.[1]).toEqual({ params: { idCotizacion: 1, size: 5 } })
    const enlaces = screen.getAllByRole('link', { name: 'Orden 0032-10' })
    expect(enlaces.length).toBeGreaterThan(0)
    expect(enlaces.every((enlace) => enlace.getAttribute('href') === '/ordenes-compra?idCotizacion=1')).toBe(true)
  })

  it('registrar la OC del cliente confirma la orden que ya existe', async () => {
    cabecera = { ...cabecera, estado: 'ACEPTADA_CLIENTE' }
    ordenes = [ordenInterna()]
    http.patch.mockResolvedValue({ data: ordenInterna({ numeroOcCliente: '0207-40' }) })
    pintar('ASISTENTE_LOGISTICO')
    fireEvent.click(await screen.findByRole('button', { name: 'Registrar OC del cliente' }))
    expect(await screen.findByRole('heading', { name: 'OC de la minera' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('N.º de OC de la minera'), { target: { value: '0207-40' } })
    fireEvent.change(screen.getByLabelText('Fecha de emisión'), { target: { value: '2026-11-20' } })
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '118' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(http.patch).toHaveBeenCalledWith('/ordenes-compra/15/confirmar-oc', {
      numeroOcCliente: '0207-40',
      fechaEmisionCliente: '2026-11-20',
      montoOcCliente: 118,
    }))
    expect(http.post).not.toHaveBeenCalled()
    expect(screen.queryByText('Esta cotización ya tiene una orden de compra registrada')).toBeNull()
  })

  it('si la orden ya trae el número del cliente, lo muestra y no ofrece un alta', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA' }
    ordenes = [ordenInterna({ numeroOcCliente: '0207-40' })]
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect(await screen.findByText('0207-40')).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Orden 0032-10' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar OC del cliente' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Registrar orden de compra' })).toBeNull()
  })

  it('una orden anulada no cuenta y deja el alta manual', async () => {
    cabecera = { ...cabecera, estado: 'ACEPTADA_CLIENTE' }
    ordenes = [ordenInterna({ estadoCodigo: 'ANULADA', numeroOrdenCompra: '0032-9' })]
    pintar('ASISTENTE_LOGISTICO')
    expect(await screen.findByRole('button', { name: 'Registrar orden de compra' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Registrar OC del cliente' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Orden 0032-9' })).toBeNull()
  })

  it('en rechazada, vencida o anulada no salen los botones de la orden', async () => {
    for (const estado of ['RECHAZADA', 'VENCIDA', 'ANULADA']) {
      cabecera = { ...cabecera, estado }
      const vista = pintar('ASISTENTE_LOGISTICO')
      expect(await screen.findByText('COT-001')).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Registrar OC del cliente' })).toBeNull()
      vista.unmount()
    }
  })

  it('pasar a negociación, sin medio ni fecha, no abre una versión ni dice que el cliente pidió cambios', async () => {
    seguimientos = [{
      idSeguimiento: 5,
      estadoAnterior: 'ENVIADA',
      estadoNuevo: 'EN_NEGOCIACION',
      fechaEvento: '2026-11-19T11:00:00',
      usuario: 'Jefe',
    }]
    pintar('JEFE_ADMINISTRATIVO')
    await cargar()
    expect(screen.getByText('Enviada → En negociación')).toBeTruthy()
    expect(screen.queryByText('El cliente solicitó cambios')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Abrir esta versión' })).toBeNull()
  })

  it('si el cliente es persona natural (DNI), no pide la OC del cliente pero sí muestra la orden', async () => {
    tipoDocCliente = 'DNI'
    cabecera = { ...cabecera, estado: 'ACEPTADA_CLIENTE' }
    ordenes = [ordenInterna()]
    pintar('ASISTENTE_LOGISTICO')
    await cargar()
    expect((await screen.findAllByRole('link', { name: 'Orden 0032-10' })).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Registrar OC del cliente' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar orden de compra' })).toBeNull()
  })
})