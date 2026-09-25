import axiosClient from "./axiosClient"

export interface CloudinaryUploadResponse {
  url: string
  nombreArchivo: string
  tipoArchivo: string
  tamanioBytes: number
}

export async function subirArchivo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const { data } = await axiosClient.post<CloudinaryUploadResponse>("/archivos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total))
    },
  })

  return data
}