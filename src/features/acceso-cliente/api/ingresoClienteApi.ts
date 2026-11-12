import axios from "axios"
import { axiosClient } from "@/api/axiosClient"
import {
  RUTA_API_INGRESO_CLIENTE,
  type IngresoClienteRequest,
  type IngresoClienteResponse,
} from "@/api/contratos/ingresoCliente"

/**
 * POST /api/portal/login. Usa axios sin los interceptores de axiosClient: un 401
 * aquí es "contraseña incorrecta", no una sesión vencida, y no debe sacar al
 * usuario de la pantalla ni poner el token interno.
 */
export async function ingresarCliente(datos: IngresoClienteRequest): Promise<IngresoClienteResponse> {
  const { data } = await axios.post<IngresoClienteResponse>(RUTA_API_INGRESO_CLIENTE, datos, {
    baseURL: axiosClient.defaults.baseURL,
    timeout: 60_000,
    headers: { Accept: "application/json" },
  })
  return data
}

/** Mensaje para el cliente según el error del ingreso o del registro. */
export function mensajeErrorAcceso(error: unknown, porDefecto: string): string {
  const err = error as { code?: string; response?: { status?: number; data?: { message?: string; error?: string } } }
  if (err.code === "ECONNABORTED") return "El servidor está despertando. Espera unos segundos y vuelve a intentar."
  if (!err.response) return "No se pudo conectar con el servidor. Verifica tu conexión o inténtalo más tarde."
  return err.response.data?.message ?? err.response.data?.error ?? porDefecto
}
