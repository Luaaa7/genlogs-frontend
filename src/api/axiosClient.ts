import axios from "axios"

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL
  if (envUrl) return envUrl.replace(/\/+$/, "")
  return "/api/v1"
}

export const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
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
            `${getApiBaseUrl()}/auth/refresh`,
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

export const http = axiosClient