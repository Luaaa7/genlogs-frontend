import axiosClient from "./axiosClient"
import type { LoginRequest, LoginResponse } from "@/types/auth"

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosClient.post<LoginResponse>("/auth/login", data)
  return response.data
}