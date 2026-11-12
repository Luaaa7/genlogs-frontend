import { describe, expect, it } from 'vitest'
import { MATRIZ, ROLES, ROLES_INTERNOS, acceso, normalizarRol, permisosDe, type Modulo, type Rol } from './permisos'

describe('permisos v3.2 (Paso 0)', () => {
  it('hay 7 roles y 6 internos', () => {
    expect(ROLES).toHaveLength(7)
    expect(ROLES_INTERNOS).toHaveLength(6)
    expect(ROLES_INTERNOS).not.toContain('CLIENTE')
  })

  it('traduce los roles viejos (v3_0_roles.sql)', () => {
    expect(normalizarRol('ADMINISTRADOR')).toBe('JEFE_ADMINISTRATIVO')
    expect(normalizarRol('vendedor')).toBe('ASISTENTE_LOGISTICO')
    expect(normalizarRol('SUPERVISOR_SST')).toBe('SUPERVISOR_SST')
    expect(normalizarRol('OTRO')).toBeNull()
    expect(normalizarRol(null)).toBeNull()
  })

  it('la matriz solo usa C, A o V', () => {
    for (const modulo of Object.keys(MATRIZ) as Modulo[]) {
      for (const valor of Object.values(MATRIZ[modulo])) expect(['C', 'A', 'V']).toContain(valor)
    }
  })

  it.each<[Rol, Modulo, ReturnType<typeof acceso>]>([
    ['JEFE_ADMINISTRATIVO', 'cotizaciones', 'A'],
    ['ASISTENTE_LOGISTICO', 'cotizaciones', 'C'],
    ['SUPERVISOR_SST', 'despacho', 'A'],
    ['SUPERVISOR_SST', 'cotizaciones', null],
    ['CONTADOR_GENERAL', 'comprobantes', 'C'],
    ['ASISTENTE_ADMINISTRATIVO', 'pedidosOc', 'C'],
    ['CLIENTE', 'vitrina', 'V'],
    ['CLIENTE', 'busqueda', null],
    ['GERENTE_GENERAL', 'administracion', 'V'],
  ])('%s en %s -> %s', (rol, modulo, esperado) => {
    expect(acceso(rol, modulo)).toBe(esperado)
  })

  it('margenes: solo Gerente, Jefe Adm. y Asist. Logistico', () => {
    const conMargen = ROLES.filter((r) => permisosDe(r).verMargenes)
    expect(conMargen).toEqual(['GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO'])
  })

  it('administracion: edita solo el Jefe Administrativo; el Gerente solo ve', () => {
    expect(permisosDe('JEFE_ADMINISTRATIVO').esAdmin).toBe(true)
    expect(permisosDe('ADMINISTRADOR').esAdmin).toBe(true)
    expect(permisosDe('GERENTE_GENERAL').esAdmin).toBe(false)
    expect(permisosDe('GERENTE_GENERAL').verAdministracion).toBe(true)
    expect(permisosDe('CLIENTE').verAdministracion).toBe(false)
  })

  it('el cliente no entra a pantallas internas', () => {
    const p = permisosDe('CLIENTE')
    expect(p.esCliente).toBe(true)
    expect(p.verCotizacionesYOrdenes).toBe(false)
    expect(p.verReclamos).toBe(false)
    expect(p.editarCotizaciones).toBe(false)
    expect(p.verNotificaciones).toBe(false)
  })

  it('claves de las pantallas actuales', () => {
    expect(permisosDe('ASISTENTE_LOGISTICO').editarCotizaciones).toBe(true)
    expect(permisosDe('ASISTENTE_ADMINISTRATIVO').editarCotizaciones).toBe(false)
    expect(permisosDe('CONTADOR_GENERAL').emitirFactura).toBe(true)
    expect(permisosDe('CONTADOR_GENERAL').verCatalogosYEmpresas).toBe(false)
    expect(permisosDe('JEFE_ADMINISTRATIVO').anularFactura).toBe(true)
    expect(permisosDe('CONTADOR_GENERAL').anularFactura).toBe(false)
    expect(permisosDe('SUPERVISOR_SST').verNotificaciones).toBe(true)
  })

  it('sin sesion no puede nada', () => {
    const p = permisosDe(undefined)
    expect(p.rol).toBeNull()
    expect(p.esInterno).toBe(false)
    expect(Object.entries(p).filter(([, v]) => v === true)).toEqual([])
  })
})