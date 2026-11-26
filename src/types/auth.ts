export interface LoginRequest {
  nombreUsuario: string
  password: string
}

export interface LoginResponse {
  token: string
  nombreUsuario: string
  nombreRol: string
  /** Si el backend lo devuelve, el panel lo guarda para renovar el token en silencio. */
  refreshToken?: string
  refresh_token?: string
}