import axiosClient from "./axiosClient"
import type { LoginRequest, LoginResponse } from "@/types/auth"

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosClient.post<LoginResponse>("/auth/login", data)
  return response.data
}

export async function solicitarRecuperacion(correo: string): Promise<void> {
  await axiosClient.post("/auth/forgot-password", { correo })
}

export async function restablecerPassword(
  token: string,
  nuevaPassword: string
): Promise<void> {
  await axiosClient.post("/auth/reset-password", { token, nuevaPassword })
}