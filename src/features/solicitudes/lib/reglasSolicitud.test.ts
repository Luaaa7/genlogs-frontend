import axios from 'axios'
import { describe, expect, it } from 'vitest'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import type { UsuarioResponse } from '@/types/usuario'
import { hoyISO } from '@/lib/formatters/fechaLocal'
import { solicitudDeRuta } from '../api/solicitudesInternasApi'
import {
  MOTIVO_ESPERA_PROVEEDOR,
  MOTIVOS_PAUSA,
  fechaEstimadaValida,
  ESTADOS_ABIERTOS,
  entraALaPantalla,
  filtrarAsignables,
  mensajeCargaUsuarios,
  motivoValido,
  puedeActuar,
  puedeVerPersonal,
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
  it('el único motivo de espera es «Esperando respuesta del proveedor» y cabe en 40 caracteres', () => {
    expect(MOTIVO_ESPERA_PROVEEDOR).toBe('Esperando respuesta del proveedor')
    expect(MOTIVOS_PAUSA).toEqual([MOTIVO_ESPERA_PROVEEDOR])
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
    expect(mensajeCargaUsuarios(error)).toBe('No tienes permiso para ver al personal interno.')
  })

  it('entran a la pantalla los cuatro roles que la matriz marca con C o V, y no Contador, SST ni Cliente', () => {
    for (const rol of ['GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO', 'ASISTENTE_ADMINISTRATIVO'] as const) {
      expect(entraALaPantalla(rol)).toBe(true)
    }
    for (const rol of ['CONTADOR_GENERAL', 'SUPERVISOR_SST', 'CLIENTE'] as const) {
      expect(entraALaPantalla(rol)).toBe(false)
    }
    expect(entraALaPantalla(null)).toBe(false)
  })

  it('solo el Asistente Logístico y el Jefe actúan; Gerente y Asistente Administrativo solo consultan', () => {
    expect(puedeActuar('ASISTENTE_LOGISTICO')).toBe(true)
    expect(puedeActuar('JEFE_ADMINISTRATIVO')).toBe(true)
    expect(puedeActuar('GERENTE_GENERAL')).toBe(false)
    expect(puedeActuar('ASISTENTE_ADMINISTRATIVO')).toBe(false)
  })

  it('solo el Jefe y el Gerente pueden pedir el listado de personal (igual que GET /usuarios)', () => {
    expect(puedeVerPersonal('JEFE_ADMINISTRATIVO')).toBe(true)
    expect(puedeVerPersonal('GERENTE_GENERAL')).toBe(true)
    for (const rol of ['ASISTENTE_LOGISTICO', 'ASISTENTE_ADMINISTRATIVO', 'CONTADOR_GENERAL', 'CLIENTE'] as const) {
      expect(puedeVerPersonal(rol)).toBe(false)
    }
    expect(puedeVerPersonal(null)).toBe(false)
  })

  it('la lista interna solo ofrece los estados abiertos, que son los que devuelve el backend', () => {
    expect(ESTADOS_ABIERTOS).toEqual(['PENDIENTE', 'EN_REVISION', 'EN_ESPERA_TERCERO'])
  })

  it('en modo real, sin fila, no inventa un GET', () => {
    expect(solicitudDeRuta(1, null, false)).toBeNull()
    const fila = { idSolicitud: 1 } as SolicitudInternaResponse
    expect(solicitudDeRuta(1, fila, false)?.idSolicitud).toBe(1)
  })
})
