import { axiosClient } from "@/api/axiosClient"

export interface ConsultaDocumentoResponse {
  numeroDocumento: string
  tipoDocumento: "RUC" | "DNI"
  razonSocial: string | null
  direccion: string | null
  simulado: boolean
}

export const tercerosApi = {
  /**
   * Autocompletado de RUC/DNI (RF-08) contra Factiliza, vía el backend
   * (GET /api/terceros/consultar-documento/{numero}). Si el backend no
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
