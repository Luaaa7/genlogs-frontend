export interface Rol {
  idRol: number
  nombreRol: string
  descripcion?: string
}

export interface UsuarioResponse {
  idUsuario: number
  nombreUsuario: string
  nombres: string
  correo: string
  nombreRol: string
  idRol?: number
  iniciales?: string
  bloqueado: boolean
}

export interface UsuarioRequest {
  idRol: number
  nombreUsuario: string
  nombres: string
  correo: string
  password: string
  iniciales: string
}
/** PUT /usuarios/{id}: el nombre de usuario y la contraseña no se editan aquí. */
export interface UsuarioUpdateRequest {
  idRol: number
  nombres: string
  correo: string
  iniciales: string
}
