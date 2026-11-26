import { codigoTipoDocumento, type TipoDocumentoRef } from '@/types/tercero.types'

interface DocumentoCliente {
  tipoDocumento?: TipoDocumentoRef | string | null
  numeroDocumento?: string | null
}

/**
 * ¿El cliente es una persona natural (DNI, pasaporte, carné de extranjería)? Solo los clientes con RUC
 * tienen orden de compra. El tipo de documento manda; si no viene, decide el número: 11 dígitos es RUC.
 * Sin ningún dato no se asume nada (false).
 */
export function esClientePersonaNatural(cliente: DocumentoCliente | null | undefined): boolean {
  const tipo = cliente?.tipoDocumento ? codigoTipoDocumento(cliente.tipoDocumento).trim().toUpperCase() : ''
  if (tipo) return tipo !== 'RUC'
  const numero = (cliente?.numeroDocumento ?? '').replace(/\s+/g, '')
  if (!numero) return false
  return !/^\d{11}$/.test(numero)
}
