import { describe, expect, it, beforeEach } from 'vitest'
import type { ConsultaTienda } from '@/api/pruebaFuentesApi'
import {
  aSolicitud,
  conteo,
  faltanMarcar,
  guardarCorridaLocal,
  leerCorridaLocal,
  marcaAutomatica,
  marcasDelPedido,
  textoPedido,
  tiendasCompletas,
  yaEsta,
  type PedidoEnCurso,
} from './corrida'

const ficha = { titulo: 'Filtro', precio: 12.5, codigoMoneda: 'USD', urlImagen: null, urlReferencia: 'https://www.ebay.com/itm/1' }
const consulta = (codigo: string, estado: ConsultaTienda['estado'], fichas = [ficha]): ConsultaTienda =>
  ({ codigo, estado, motivo: null, fichas })

describe('prueba de 10 pedidos (M3, BPMN 9-C)', () => {
  beforeEach(() => sessionStorage.clear())

  it('sin fichas o con error la tienda no acierta; las omitidas no se evalúan', () => {
    expect(marcaAutomatica(consulta('EBAY', 'SIN_RESULTADOS', []))).toEqual({ acerto: false, enlace: null })
    expect(marcaAutomatica(consulta('EBAY', 'BLOQUEADA', []))).toEqual({ acerto: false, enlace: null })
    expect(marcaAutomatica(consulta('EBAY', 'OK', []))).toEqual({ acerto: false, enlace: null })
    expect(marcaAutomatica(consulta('EBAY', 'OK'))).toBeNull()
    expect(marcaAutomatica(consulta('EBAY', 'OMITIDA_SESION', []))).toBeNull()
    expect(marcaAutomatica(consulta('EBAY', 'NO_CONECTADO', []))).toBeNull()
  })

  it('pide marcar solo las tiendas con fichas y arma las marcas del pedido', () => {
    const consultas = [consulta('EBAY', 'OK'), consulta('AMAZON', 'SIN_RESULTADOS', []), consulta('ALIBABA', 'OMITIDA_SESION', [])]
    expect(faltanMarcar(consultas, {})).toEqual(['EBAY'])
    const marcas = { EBAY: { acerto: true, enlace: ficha.urlReferencia } }
    expect(faltanMarcar(consultas, marcas)).toEqual([])
    expect(marcasDelPedido(consultas, marcas)).toEqual({
      EBAY: { acerto: true, enlace: ficha.urlReferencia },
      AMAZON: { acerto: false, enlace: null },
    })
  })

  it('el pedido es marca + N.º de parte y no se repite', () => {
    expect(textoPedido('  CAT ', ' 1R-0750 ')).toBe('CAT 1R-0750')
    expect(textoPedido('', '1R-0750')).toBe('1R-0750')
    expect(yaEsta([{ pedido: 'CAT 1R-0750', tiendas: {} }], 'cat 1r-0750')).toBe(true)
  })

  it('solo guarda las tiendas evaluadas en todos los pedidos', () => {
    const pedidos: PedidoEnCurso[] = [
      { pedido: 'A', tiendas: { EBAY: { acerto: true, enlace: 'x' }, AMAZON: { acerto: false, enlace: null } } },
      { pedido: 'B', tiendas: { EBAY: { acerto: false, enlace: null } } },
    ]
    expect(tiendasCompletas(pedidos)).toEqual(['EBAY'])
    expect(conteo(pedidos)).toEqual({ EBAY: { aciertos: 1, evaluados: 2 }, AMAZON: { aciertos: 0, evaluados: 1 } })
    expect(aSolicitud(pedidos, ['EBAY'])).toEqual([
      { pedido: 'A', resultados: [{ fuente: 'EBAY', acerto: true, enlace: 'x' }] },
      { pedido: 'B', resultados: [{ fuente: 'EBAY', acerto: false, enlace: null }] },
    ])
  })

  it('la corrida en curso sobrevive a un F5 y se borra al vaciarla', () => {
    const pedidos: PedidoEnCurso[] = [{ pedido: 'A', tiendas: {} }]
    guardarCorridaLocal(pedidos)
    expect(leerCorridaLocal()).toEqual(pedidos)
    guardarCorridaLocal([])
    expect(leerCorridaLocal()).toEqual([])
    sessionStorage.setItem('genlogs-prueba-10-pedidos', 'no es json')
    expect(leerCorridaLocal()).toEqual([])
  })
})