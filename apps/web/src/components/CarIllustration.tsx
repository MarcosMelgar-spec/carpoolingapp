const COLOR_MAP: Record<string, string> = {
  blanco: "#f1f5f9",
  negro: "#1e293b",
  rojo: "#dc2626",
  azul: "#2563eb",
  celeste: "#38bdf8",
  gris: "#94a3b8",
  "gris oscuro": "#475569",
  plata: "#cbd5e1",
  plateado: "#cbd5e1",
  verde: "#16a34a",
  naranja: "#f97316",
  amarillo: "#eab308",
  "bordó": "#9f1239",
  bordo: "#9f1239",
  "marrón": "#78350f",
  marron: "#78350f",
  beige: "#d4b896",
  violeta: "#7c3aed",
  rosa: "#ec4899",
  turquesa: "#0d9488",
  dorado: "#ca8a04",
  champagne: "#e8d5b0",
};

function resolveColor(color?: string | null): string {
  if (!color) return "#94a3b8";
  const normalized = color.toLowerCase().trim();
  // Exact match
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];
  // Partial match: "azul marino" → azul, "rojo oscuro" → rojo
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return "#94a3b8";
}

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function adjustColor(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function CarIllustration({ color }: { color?: string | null }) {
  const body = resolveColor(color);
  const dark = isDark(body);
  const shadow = adjustColor(body, dark ? 15 : -35);
  const highlight = dark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.38)";
  const windowFill = "rgba(186,228,248,0.72)";
  const windowStroke = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  return (
    <div className="mt-3 rounded-lg overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 px-4 pt-5 pb-3">
      <svg viewBox="0 0 320 120" className="w-full h-auto" aria-hidden="true">
        {/* Ground shadow */}
        <ellipse cx="160" cy="116" rx="130" ry="6" fill="rgba(0,0,0,0.10)" />

        {/* ── Car body ── */}
        <path
          d="M18,108 L18,86 Q18,79 30,77 L58,77 L90,44 L108,39 L214,39 L233,44 L258,77 L287,77 Q300,79 300,88 L300,108 Z"
          fill={body}
        />

        {/* Body shadow underside */}
        <path
          d="M18,100 L18,108 L300,108 L300,100 Q200,106 160,106 Q100,106 18,100 Z"
          fill={shadow}
          opacity="0.55"
        />

        {/* Roof highlight */}
        <path
          d="M112,40 L213,40 L210,44 L114,44 Z"
          fill={highlight}
        />

        {/* ── Windows ── */}
        {/* Front windshield */}
        <path
          d="M93,74 L113,46 L133,44 L133,74 Z"
          fill={windowFill}
          stroke={windowStroke}
          strokeWidth="1"
        />
        {/* Rear window */}
        <path
          d="M136,74 L136,44 L214,41 L232,46 L256,74 Z"
          fill={windowFill}
          stroke={windowStroke}
          strokeWidth="1"
        />
        {/* B-pillar */}
        <rect x="133.5" y="44" width="2" height="30" fill={shadow} opacity="0.6" />

        {/* Window shine */}
        <path d="M99,50 L120,47 L120,54 L101,57 Z" fill="rgba(255,255,255,0.28)" />
        <path d="M142,47 L195,43 L195,49 L142,53 Z" fill="rgba(255,255,255,0.18)" />

        {/* Door line */}
        <line x1="193" y1="74" x2="196" y2="108" stroke={shadow} strokeWidth="1.5" opacity="0.5" />

        {/* Headlight */}
        <path d="M293,84 L293,97 Q300,95 300,90 L300,86 Z" fill="#fef08a" opacity="0.9" />
        <path d="M291,84 L291,97 L293,97 L293,84 Z" fill="#fde047" opacity="0.6" />

        {/* Taillight */}
        <path d="M25,84 L25,97 Q18,95 18,90 L18,86 Z" fill="#fca5a5" opacity="0.9" />
        <path d="M25,84 L25,97 L27,97 L27,84 Z" fill="#f87171" opacity="0.6" />

        {/* ── Wheels ── */}
        {/* Front */}
        <circle cx="75" cy="108" r="21" fill="#0f172a" />
        <circle cx="75" cy="108" r="14" fill="#475569" />
        <circle cx="75" cy="108" r="8" fill="#1e293b" />
        <circle cx="75" cy="108" r="3" fill="#64748b" />
        {/* Front spokes */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={75 + 8 * Math.cos(rad)}
              y1={108 + 8 * Math.sin(rad)}
              x2={75 + 14 * Math.cos(rad)}
              y2={108 + 14 * Math.sin(rad)}
              stroke="#64748b"
              strokeWidth="2"
            />
          );
        })}

        {/* Rear */}
        <circle cx="247" cy="108" r="21" fill="#0f172a" />
        <circle cx="247" cy="108" r="14" fill="#475569" />
        <circle cx="247" cy="108" r="8" fill="#1e293b" />
        <circle cx="247" cy="108" r="3" fill="#64748b" />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={247 + 8 * Math.cos(rad)}
              y1={108 + 8 * Math.sin(rad)}
              x2={247 + 14 * Math.cos(rad)}
              y2={108 + 14 * Math.sin(rad)}
              stroke="#64748b"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}
