interface Props {
  texto?: string;
  className?: string;
}

const BARRAS = Array.from({ length: 12 }, (_, i) => ({
  angulo: i * 30,
  opacidad: Number((1 - i * 0.0833).toFixed(2)),
}));

export default function CargandoSpinner({
  texto = 'Cargando...',
  className = '',
}: Props) {
  return (
    <div
      className={`flex flex-col justify-center items-center py-20 min-h-[300px] ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-12 h-12 text-blue-900 dark:text-blue-300 spinner-pasos"
        fill="currentColor"
        aria-hidden="true"
      >
        {BARRAS.map(({ angulo, opacidad }) => (
          <rect
            key={angulo}
            x="46"
            y="10"
            rx="4"
            ry="4"
            width="8"
            height="20"
            opacity={opacidad}
            transform={`rotate(${angulo} 50 50)`}
          />
        ))}
      </svg>
      <p className="text-gray-500 font-medium mt-3">{texto}</p>
    </div>
  );
}