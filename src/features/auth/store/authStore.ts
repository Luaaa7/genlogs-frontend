import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  token: string | null
  nombreUsuario: string | null
  nombreRol: string | null
  login: (token: string, nombreUsuario: string, nombreRol: string) => void
  logout: () => void
  hasRole: (rol: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      nombreUsuario: null,
      nombreRol: null,
      login: (token, nombreUsuario, nombreRol) =>
        set({ token, nombreUsuario, nombreRol }),
      logout: () => set({ token: null, nombreUsuario: null, nombreRol: null }),
      hasRole: (rol) => get().nombreRol?.toLowerCase() === rol.toLowerCase(),
    }),
    { name: "genlogs-auth" } // clave en localStorage
  )
)