import axios from 'axios'
import { describe, expect, it } from 'vitest'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import type { UsuarioResponse } from '@/types/usuario'
import { hoyISO } from '@/lib/formatters/fechaLocal'
import { solicitudDeRuta } from '../api/solicitudesInternasApi'
import {
  MOTIVOS_PAUSA,
  fechaEstimadaValida,
  filtrarAsignables,
  mensajeCargaUsuarios,
  motivoValido,
} from './reglasSolicitud'

const usuario = (nombreRol: string, bloqueado = false): UsuarioResponse => ({
  idUsuario: nombreRol.length,
  nombreUsuario: nombreRol,
  nombres: nombreRol,
  correo: 'a@b.c',
  nombreRol,
  bloqueado,
})

describe('reglas de la solicitud interna', () => {
  it('cada motivo predefinido cabe en 40 caracteres y el texto libre no', () => {
    for (const motivo of MOTIVOS_PAUSA) expect(motivo.length).toBeLessThanOrEqual(40)
    expect(motivoValido('')).toBe(false)
    expect(motivoValido('   ')).toBe(false)
    expect(motivoValido('a'.repeat(40))).toBe(true)
    expect(motivoValido('a'.repeat(41))).toBe(false)
  })

  it('rechaza una fecha estimada pasada y acepta hoy, comparando la fecha local', () => {
    expect(fechaEstimadaValida('')).toBe(true)
    expect(fechaEstimadaValida(hoyISO())).toBe(true)
    expect(fechaEstimadaValida('2000-01-01')).toBe(false)
    expect(fechaEstimadaValida('2999-12-31')).toBe(true)
  })

  it('solo deja asistente logístico y jefe, activos', () => {
    const lista = filtrarAsignables([
      usuario('ASISTENTE_LOGISTICO'),
      usuario('JEFE_ADMINISTRATIVO'),
      usuario('ASISTENTE_LOGISTICO', true),
      usuario('CONTADOR_GENERAL'),
      usuario('SUPERVISOR_SST'),
      usuario('ASISTENTE_ADMINISTRATIVO'),
      usuario('CLIENTE'),
    ])
    expect(lista.map((u) => u.nombreUsuario)).toEqual(['ASISTENTE_LOGISTICO', 'JEFE_ADMINISTRATIVO'])
  })

  it('el 403 del listado de usuarios tiene un mensaje propio', () => {
    const error = new axios.AxiosError('no')
    error.response = { status: 403, data: { message: 'Forbidden' }, statusText: 'Forbidden', headers: {}, config: {} as never }
    expect(mensajeCargaUsuarios(error)).toMatch(/no está habilitado para el Jefe/)
  })

  it('en modo real, sin fila, no inventa un GET', () => {
    expect(solicitudDeRuta(1, null, false)).toBeNull()
    const fila = { idSolicitud: 1 } as SolicitudInternaResponse
    expect(solicitudDeRuta(1, fila, false)?.idSolicitud).toBe(1)
  })
})
