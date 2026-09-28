import axios from "axios"

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 60_000, // 👈 Subido a 60 segundos para los "cold starts" de Render
  headers: {
    "Content-Type": "application/json",
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")
        if (refreshToken) {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? "/api/v1"}/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          )

          const { accessToken, refreshToken: newRefreshToken } = data
          localStorage.setItem("access_token", accessToken)
          localStorage.setItem("refresh_token", newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return axiosClient(originalRequest)
        }
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)