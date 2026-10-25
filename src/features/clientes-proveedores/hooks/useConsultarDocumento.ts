import { useMutation } from '@tanstack/react-query';
import { tercerosApi } from '../../../api/tercerosApi';

/** Cache simple en memoria para evitar consultas repetidas al mismo documento. */
const consultaCache = new Map<string, { data: Awaited<ReturnType<typeof tercerosApi.consultarDocumento>>; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Autocompletado de RUC/DNI (RF-08). Se usa desde ClienteForm/ProveedorForm:
 * el botón "Buscar" llama a mutateAsync(numeroDocumento) y con la respuesta
 * se precargan razonSocial y direccion en el formulario.
 *
 * Mejoras:
 * - retry con backoff exponencial para 429/5xx
 * - cache en memoria (5 min) para evitar llamadas duplicadas
 */
export const useConsultarDocumento = () => {
  return useMutation({
    mutationFn: async (numero: string) => {
      // Normalizar clave de cache (solo dígitos)
      const key = numero.replace(/\D/g, '');
      const cached = consultaCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }

      const data = await tercerosApi.consultarDocumento(numero);
      consultaCache.set(key, { data, timestamp: Date.now() });
      return data;
    },
    retry: (failureCount, error) => {
      // Reintentar solo en errores de red, 429 (rate limit) o 5xx
      if (failureCount >= 3) return false;
      const status = (error as { response?: { status?: number } })?.response?.status;
      return !status || status === 429 || (status >= 500 && status < 600);
    },
    retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 10_000), // 2s, 4s, 8s (máx 10s)
  });
};
