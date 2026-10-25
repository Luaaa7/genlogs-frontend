import { useMutation } from '@tanstack/react-query';
import { tercerosApi } from '../../../api/tercerosApi';

/**
 * Autocompletado de RUC/DNI (RF-08). Se usa desde ClienteForm/ProveedorForm:
 * el botón "Buscar" llama a mutateAsync(numeroDocumento) y con la respuesta
 * se precargan razonSocial y direccion en el formulario.
 */
export const useConsultarDocumento = () => {
  return useMutation({
    mutationFn: tercerosApi.consultarDocumento,
  });
};
