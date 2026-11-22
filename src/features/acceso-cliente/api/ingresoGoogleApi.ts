import axios from "axios"
import { axiosClient } from "@/api/axiosClient"
import {
  RUTA_API_CUENTA_PORTAL,
  RUTA_API_EMPRESA_PORTAL,
  RUTA_API_INGRESO_GOOGLE,
  type CompletarEmpresaRequest,
  type CompletarEmpresaResponse,
  type CuentaPortalResponse,
  type IngresoGoogleResponse,
} from "@/api/contratos/ingresoGoogle"

/**
 * POST /api/portal/google. Igual que el ingreso con correo, va sin los interceptores
 * de axiosClient: un rechazo aquí no es una sesión vencida.
 */
export async function ingresarConGoogle(credential: string): Promise<IngresoGoogleResponse> {
  const { data } = await axios.post<IngresoGoogleResponse>(RUTA_API_INGRESO_GOOGLE, { credential }, {
    baseURL: axiosClient.defaults.baseURL,
    timeout: 60_000,
    headers: { Accept: "application/json" },
  })
  return data
}

export function obtenerCuentaPortal(): Promise<CuentaPortalResponse> {
  return axiosClient.get<CuentaPortalResponse>(RUTA_API_CUENTA_PORTAL).then(({ data }) => data)
}

export function completarEmpresa(datos: CompletarEmpresaRequest): Promise<CompletarEmpresaResponse> {
  return axiosClient.post<CompletarEmpresaResponse>(RUTA_API_EMPRESA_PORTAL, datos).then(({ data }) => data)
}
