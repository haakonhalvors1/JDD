// Enkle SVG-illustrasjoner (ingen kopierte produktbilder). Dekorative med mindre tittel er gitt.

interface P {
  className?: string
  tittel?: string
}

function Svg({ tittel, className, children, viewBox = '0 0 120 80' }: P & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className={className} role={tittel ? 'img' : undefined} aria-hidden={tittel ? undefined : true} aria-label={tittel}>
      {children}
    </svg>
  )
}

export function Lampe({ className, tittel, pro }: P & { pro?: boolean }) {
  return (
    <Svg className={className} tittel={tittel}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#f5f5f5" />
      <circle cx="60" cy="40" r="28" fill="#1a1a1a" />
      <circle cx="60" cy="40" r="22" fill={pro ? '#fffbe6' : '#eef3ff'} stroke="#999" />
      {[0, 60, 120, 180, 240, 300].map((v) => (
        <circle key={v} cx={60 + 12 * Math.cos((v * Math.PI) / 180)} cy={40 + 12 * Math.sin((v * Math.PI) / 180)} r="3.2" fill="#ffd34d" />
      ))}
      <circle cx="60" cy="40" r="4" fill="#ffd34d" />
      <rect x="54" y="68" width="12" height="8" fill="#1a1a1a" />
    </Svg>
  )
}

export function Brakett({ className, tittel }: P) {
  return (
    <Svg className={className} tittel={tittel}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#f5f5f5" />
      <rect x="15" y="30" width="90" height="10" rx="2" fill="#333" />
      <rect x="35" y="40" width="50" height="22" rx="2" fill="none" stroke="#333" strokeWidth="4" />
      <circle cx="22" cy="25" r="6" fill="#333" />
      <circle cx="98" cy="25" r="6" fill="#333" />
    </Svg>
  )
}

export function Rele({ className, tittel }: P) {
  return (
    <Svg className={className} tittel={tittel}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#f5f5f5" />
      <rect x="35" y="20" width="50" height="40" rx="4" fill="#1a1a1a" />
      <text x="60" y="45" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="sans-serif">CAN</text>
      <path d="M10 30 H35 M10 50 H35 M85 30 H110 M85 50 H110" stroke="#c8102e" strokeWidth="3" />
    </Svg>
  )
}

export function Kabel({ className, tittel }: P) {
  return (
    <Svg className={className} tittel={tittel}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#f5f5f5" />
      <path d="M10 60 C 40 10, 80 70, 110 20" stroke="#1a1a1a" strokeWidth="4" fill="none" />
      <path d="M10 66 C 40 16, 80 76, 110 26" stroke="#c8102e" strokeWidth="4" fill="none" />
      <rect x="48" y="30" width="22" height="16" rx="2" fill="#555" />
    </Svg>
  )
}

export function Tilbehor({ className, tittel }: P) {
  return (
    <Svg className={className} tittel={tittel}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#f5f5f5" />
      <rect x="35" y="22" width="50" height="36" rx="6" fill="none" stroke="#555" strokeWidth="4" strokeDasharray="6 4" />
      <path d="M60 30 V50 M50 40 H70" stroke="#555" strokeWidth="4" />
    </Svg>
  )
}

/** Frontlys: LED (striper/prosjektor) eller halogen (stor reflektor med pære) */
export function Frontlys({ type, className, tittel }: P & { type: 'LED' | 'halogen' }) {
  return (
    <Svg className={className} tittel={tittel} viewBox="0 0 160 90">
      <rect x="0" y="0" width="160" height="90" rx="8" fill="#e9eef5" />
      <path d="M12 60 Q 20 18 80 14 Q 140 14 148 50 Q 120 76 40 76 Z" fill="#cfd6df" stroke="#333" strokeWidth="2" />
      {type === 'LED' ? (
        <>
          <path d="M30 34 Q 80 20 136 36" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M30 34 Q 80 20 136 36" stroke="#9fd2ff" strokeWidth="2" strokeLinecap="round" fill="none" />
          {[52, 72, 92, 112].map((x) => (
            <rect key={x} x={x - 7} y="46" width="14" height="14" rx="3" fill="#ffffff" stroke="#333" />
          ))}
        </>
      ) : (
        <>
          <circle cx="80" cy="46" r="24" fill="#f4f1e6" stroke="#333" strokeWidth="2" />
          <circle cx="80" cy="46" r="7" fill="#ffd34d" stroke="#8a6d00" />
          <path d="M80 39 V 30" stroke="#8a6d00" strokeWidth="2" />
        </>
      )}
    </Svg>
  )
}

export function ProduktBilde({ kategori, pro, className }: { kategori: string; pro?: boolean; className?: string }) {
  switch (kategori) {
    case 'lys':
      return <Lampe className={className} pro={pro} />
    case 'brakett':
      return <Brakett className={className} />
    case 'rele':
      return <Rele className={className} />
    case 'kabelsett':
    case 'plugplay':
    case 'forgrening':
      return <Kabel className={className} />
    default:
      return <Tilbehor className={className} />
  }
}

/** Skjematisk koblingsskjema (K9-plassholder) */
export function Koblingsskjema({ className, rele }: P & { rele: boolean }) {
  return (
    <Svg className={className} tittel={`Skjematisk koblingsskjema (illustrasjon) med ${rele ? 'Canbus-relé' : 'kabelsett'}`} viewBox="0 0 320 140">
      <rect width="320" height="140" rx="8" fill="#f5f5f5" />
      <rect x="16" y="50" width="70" height="40" rx="4" fill="#fff" stroke="#333" />
      <text x="51" y="74" textAnchor="middle" fontSize="11" fontFamily="sans-serif">Batteri</text>
      <rect x="125" y="50" width="70" height="40" rx="4" fill="#1a1a1a" />
      <text x="160" y="74" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="sans-serif">{rele ? 'Canbus-relé' : 'Relé'}</text>
      <circle cx="260" cy="40" r="18" fill="#fff" stroke="#333" />
      <circle cx="260" cy="100" r="18" fill="#fff" stroke="#333" />
      <text x="260" y="44" textAnchor="middle" fontSize="10" fontFamily="sans-serif">Lys</text>
      <text x="260" y="104" textAnchor="middle" fontSize="10" fontFamily="sans-serif">Lys</text>
      <path d="M86 70 H125 M195 70 H220 V40 H242 M220 70 V100 H242" stroke="#c8102e" strokeWidth="3" fill="none" />
      <path d="M160 50 V20 H110" stroke="#0b5394" strokeWidth="2" strokeDasharray="5 3" fill="none" />
      <text x="105" y="16" textAnchor="end" fontSize="10" fontFamily="sans-serif">{rele ? 'Canbus-signal' : 'Fjernlys +'}</text>
    </Svg>
  )
}
