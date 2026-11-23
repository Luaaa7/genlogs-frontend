/** Escena decorativa del hero: cerros, carretera y un camión con 3 cajas (engranaje, válvula, filtro). Colores de claro/oscuro con `dark:`. */
export function EscenaCamion() {
  return (
    <svg data-escena-camion aria-hidden="true" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 hidden h-full w-full md:block">
      <g className="gl-par1"><path d="M0 520 L140 430 L250 480 L390 360 L520 450 L640 390 L780 470 L900 380 L1040 440 L1160 350 L1280 420 V800 H0Z" className="fill-[#d7e4f2] dark:fill-[#244a75]" /></g>
      <g className="gl-par2">
        <path d="M0 590 L180 500 L300 560 L460 470 L600 540 L760 480 L900 560 L1060 470 L1180 530 L1280 490 V800 H0Z" className="fill-[#c3d6ec] dark:fill-[#1b3f66]" />
        <path d="M460 470 l-30 60 h60z M1060 470 l-26 52 h52z" opacity=".6" className="fill-[#b0c8e4] dark:fill-[#2a5585]" />
      </g>
      <rect x="0" y="640" width="1280" height="160" className="fill-[#dfe8f2] dark:fill-[#14304f]" />
      <g className="gl-road" stroke="#2e6ba8" strokeWidth="6" strokeLinecap="round" strokeDasharray="44 52"><path d="M-100 700 H1400" /></g>
      <g className="gl-truck">
        {[[760, 612, 6, ""], [754, 606, 8, "gl-dd1"], [748, 600, 10, "gl-dd2"], [742, 612, 12, "gl-dd3"]].map(([cx, cy, r, d]) => (
          <circle key={cx} className={`gl-dust ${d} fill-[#94a3b8] dark:fill-[#c9dcf0]`} cx={cx} cy={cy} r={r} />
        ))}
        <g className="gl-bob">
          <rect x="770" y="566" width="330" height="26" rx="4" fill="#e1aa12" stroke="#0f2440" strokeWidth="4" />
          {/* caja 1: engranaje */}
          <rect x="786" y="486" width="96" height="80" rx="5" fill="#e2e8f0" stroke="#0f2440" strokeWidth="4" />
          <path d="M786 512 h96" stroke="#0f2440" strokeWidth="3" opacity=".4" />
          <g transform="translate(834,540)" fill="none" stroke="#1e3a5f" strokeWidth="3"><circle r="9" /><path d="M0-16v5M0 11v5M-16 0h5M11 0h5M-11-11l3.5 3.5M7.5 7.5l3.5 3.5M-11 11l3.5-3.5M7.5-7.5l3.5-3.5" /></g>
          {/* caja 2: válvula */}
          <rect x="890" y="456" width="110" height="110" rx="5" fill="#cbd5e1" stroke="#0f2440" strokeWidth="4" />
          <path d="M890 490 h110 M945 456 v34" stroke="#0f2440" strokeWidth="3" opacity=".4" />
          <g transform="translate(945,532)" stroke="#1e3a5f" strokeWidth="3" fill="none"><rect x="-22" y="-8" width="44" height="16" rx="3" /><path d="M0-8v-14M-10-24h20" /></g>
          {/* caja 3: filtro */}
          <rect x="1008" y="506" width="62" height="60" rx="5" fill="#e2e8f0" stroke="#0f2440" strokeWidth="4" />
          <g transform="translate(1039,538)" stroke="#1e3a5f" strokeWidth="3" fill="none"><rect x="-10" y="-16" width="20" height="32" rx="4" /><path d="M-10-6h20M-10 4h20" /></g>
          {/* cabina */}
          <path d="M1086 566 V500 a10 10 0 0 1 10-10 h44 l34 40 v36 z" fill="#f4c430" stroke="#0f2440" strokeWidth="4" strokeLinejoin="round" />
          <path d="M1112 502 h26 l24 28 h-50z" fill="#93c5fd" stroke="#0f2440" strokeWidth="3" />
          <rect x="1086" y="566" width="92" height="34" rx="5" fill="#f4c430" stroke="#0f2440" strokeWidth="4" />
          <rect x="1170" y="574" width="10" height="14" rx="3" fill="#fde68a" />
          <rect x="770" y="592" width="408" height="10" fill="#0f2440" />
        </g>
        {[850, 1120].map((x) => (
          <g key={x} className="gl-wheel" style={{ transformOrigin: `${x}px 624px` }}>
            <circle cx={x} cy="624" r="38" fill="#0f2440" />
            <circle cx={x} cy="624" r="16" fill="#3b5b80" />
            <path d={`M${x} 596 v56 M${x - 28} 624 h56`} stroke="#14304f" strokeWidth="6" />
          </g>
        ))}
      </g>
    </svg>
  )
}
