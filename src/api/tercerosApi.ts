import { axiosClient } from "@/api/axiosClient"

export interface ConsultaDocumentoResponse {
  numeroDocumento: string
  tipoDocumento: "RUC" | "DNI"
  /** Razón social (RUC) o nombre completo (DNI). */
  razonSocial: string | null
  /** Solo DNI: nombres y apellidos por separado. */
  nombres?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  direccion: string | null
  /** UBIGEO de 6 dígitos del domicilio, si Factiliza lo devuelve. */
  ubigeo?: string | null
  /** Distrito del catálogo que corresponde al UBIGEO (null si no se encontró). */
  idDistrito?: number | null
  /**
   * De dónde salieron los datos: REGISTRADO (cliente o proveedor ya registrado),
   * GUARDADO (consultado antes), FACTILIZA (consulta nueva) o SIMULADO.
   */
  origen?: 'REGISTRADO' | 'GUARDADO' | 'FACTILIZA' | 'SIMULADO'
  simulado: boolean
}

export const tercerosApi = {
  /**
   * Autocompletado de RUC/DNI (RF-08), vía el backend
   * (GET /api/terceros/consultar-documento/{numero}). El backend busca primero
   * en los clientes y proveedores registrados, luego en las consultas ya
   * guardadas y recién después en Factiliza. Si el backend no
   * tiene FACTILIZA_API_KEY configurada todavía, responde con datos
   * simulados y `simulado: true`.
   */
  async consultarDocumento(numero: string): Promise<ConsultaDocumentoResponse> {
    const response = await axiosClient.get<ConsultaDocumentoResponse>(
      `/terceros/consultar-documento/${numero}`
    )
    return response.data
  },
}