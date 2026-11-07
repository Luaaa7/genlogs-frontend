import React, { useEffect, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  enviarCotizacionSchema,
  type EnviarCotizacionFormData,
} from "@/lib/validators/cotizacion.schema";
import { useEnviarCotizacion } from "../hooks/useCotizacionesMutations";
import { useCotizacion } from "../hooks/useCotizaciones";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { X, Send, Loader2, Paperclip } from "lucide-react";

interface ConfirmacionEnvioModalProps {
  cotizacionId: number;
  emailPredeterminado?: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Mensaje del backend (400/500) o uno genérico. */
function mensajeDeError(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data;
  return msg?.mensaje ?? msg?.message ?? "No se pudo enviar el correo. Revisa tu conexión e intenta de nuevo.";
}

export const ConfirmacionEnvioModal: React.FC<ConfirmacionEnvioModalProps> = ({
  cotizacionId,
  emailPredeterminado = "",
  isOpen,
  onClose,
}) => {
  const { mutate: enviarCotizacion, isPending } = useEnviarCotizacion(cotizacionId);
  // Ya está en caché (la usa la página de detalle): de aquí sale el código para el asunto y el PDF.
  const { data: cotizacion } = useCotizacion(cotizacionId);
  const codigo = cotizacion?.codigoCotizacion;
  const [error, setError] = useState<string | null>(null);

  const valoresIniciales = (): EnviarCotizacionFormData => ({
    correoDestinatario: emailPredeterminado,
    asunto: codigo ? `Cotización ${codigo} - GenLogs` : `Cotización #${cotizacionId}`,
    mensaje: "Estimado cliente, adjuntamos la cotización solicitada.",
    incluirDetalles: true,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnviarCotizacionFormData>({
    resolver: zodResolver(enviarCotizacionSchema),
    defaultValues: valoresIniciales(),
  });

  // Cada vez que se abre: datos frescos (correo del cliente y código).
  useEffect(() => {
    if (isOpen) reset(valoresIniciales());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, codigo, emailPredeterminado]);

  if (!isOpen) return null;

  // Al cerrar se limpia el error, así la próxima vez abre sin el aviso anterior.
  const cerrar = () => {
    setError(null);
    onClose();
  };

  const onSubmit: SubmitHandler<EnviarCotizacionFormData> = (data) => {
    setError(null);
    enviarCotizacion(data, {
      onSuccess: (respuesta) => {
        // El backend responde 200 aunque el correo no salga: hay que mirar "success".
        if (respuesta?.success === false) {
          setError(respuesta.mensaje || "No se pudo enviar el correo. Intenta de nuevo.");
          return;
        }
        cerrar();
      },
      onError: (err) => setError(mensajeDeError(err)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="envio-titulo"
        className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="envio-titulo" className="text-lg font-semibold text-foreground">Enviar Cotización</h3>
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Correo Destinatario */}
          <div>
            <label htmlFor="envio-correo" className="block text-sm font-medium text-foreground">
              Correo del Destinatario
            </label>
            <Controller
              name="correoDestinatario"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="envio-correo"
                  type="email"
                  className="mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none"
                />
              )}
            />
            {errors.correoDestinatario && (
              <p className="mt-1 text-xs text-destructive">{errors.correoDestinatario.message}</p>
            )}
          </div>

          {/* Asunto */}
          <div>
            <label htmlFor="envio-asunto" className="block text-sm font-medium text-foreground">Asunto</label>
            <Controller
              name="asunto"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="envio-asunto"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none"
                />
              )}
            />
            {errors.asunto && (
              <p className="mt-1 text-xs text-destructive">{errors.asunto.message}</p>
            )}
          </div>

          {/* Mensaje */}
          <div>
            <label htmlFor="envio-mensaje" className="block text-sm font-medium text-foreground">Mensaje</label>
            <Controller
              name="mensaje"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="envio-mensaje"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none"
                />
              )}
            />
            {errors.mensaje && (
              <p className="mt-1 text-xs text-destructive">{errors.mensaje.message}</p>
            )}
          </div>

          {/* PDF adjunto */}
          <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Se adjunta el PDF: Cotizacion-{codigo ?? cotizacionId}.pdf
          </p>

          {/* Checkbox Incluir Detalles */}
          <div className="flex items-center gap-2">
            <Controller
              name="incluirDetalles"
              control={control}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <input
                  {...fieldProps}
                  type="checkbox"
                  id="incluirDetalles"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
              )}
            />
            <label htmlFor="incluirDetalles" className="text-sm text-foreground">
              Mostrar el total en el texto del correo
            </label>
          </div>

          {error && <ErrorBanner message={error} />}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={cerrar}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};