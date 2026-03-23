"use client";

import { useId } from "react";
import { Playfair_Display } from "next/font/google";
import type { LogoCenterVariant } from "@/lib/logo-lab-options";

export type { LogoCenterVariant } from "@/lib/logo-lab-options";
export { LOGO_LAB_OPTIONS } from "@/lib/logo-lab-options";

const displayLabel = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  display: "swap",
});

type CenterProps = {
  variant: LogoCenterVariant;
  gold: string;
  goldDeep: string;
  labelFilter: string;
  ff: string;
};

function LogoCenter({ variant, gold, goldDeep, labelFilter, ff }: CenterProps) {
  switch (variant) {
    case "cb":
      return (
        <g filter={`url(#${labelFilter})`}>
          <text
            x={50}
            y={53.2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={`url(#${gold})`}
            stroke="#120a02"
            strokeWidth={0.42}
            strokeOpacity={0.9}
            paintOrder="stroke fill"
            style={{
              fontFamily: ff,
              fontSize: "28px",
              fontWeight: 700,
              fontStyle: "italic",
              letterSpacing: "-0.08em",
            }}
          >
            CB
          </text>
        </g>
      );

    case "c":
      return (
        <g filter={`url(#${labelFilter})`}>
          <text
            x={50}
            y={53.5}
            textAnchor="middle"
            dominantBaseline="central"
            fill={`url(#${gold})`}
            stroke="#120a02"
            strokeWidth={0.5}
            strokeOpacity={0.9}
            paintOrder="stroke fill"
            style={{
              fontFamily: ff,
              fontSize: "40px",
              fontWeight: 700,
              fontStyle: "italic",
              letterSpacing: "-0.06em",
            }}
          >
            C
          </text>
        </g>
      );

    case "note":
      return (
        <g filter={`url(#${labelFilter})`}>
          <ellipse
            cx="46.5"
            cy="54.5"
            rx="6.2"
            ry="4.1"
            transform="rotate(-26 46.5 54.5)"
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.35"
          />
          <rect x="54.8" y="27.5" width="3.1" height="29" rx="0.6" fill={`url(#${gold})`} stroke="#1a0f04" strokeWidth="0.3" />
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            d="M 57.8 28.5 Q 52 26 48.5 29.5"
          />
        </g>
      );

    case "headphones":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="2.85"
            strokeLinecap="round"
            d="M 35.5 43.5 Q 35.5 31.5 50 29.5 Q 64.5 31.5 64.5 43.5"
          />
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.4"
            d="M 31.5 41.5 A 7 9.5 0 0 1 37 52.5 L 37 56 A 4.5 5.5 0 0 0 41 61.5 H 42.5 A 3.8 4.5 0 0 0 44 56.5 V 49 A 6.5 8 0 0 0 31.5 41.5 Z"
          />
          <g transform="translate(100,0) scale(-1,1)">
            <path
              fill={`url(#${gold})`}
              stroke="#1a0f04"
              strokeWidth="0.4"
              d="M 31.5 41.5 A 7 9.5 0 0 1 37 52.5 L 37 56 A 4.5 5.5 0 0 0 41 61.5 H 42.5 A 3.8 4.5 0 0 0 44 56.5 V 49 A 6.5 8 0 0 0 31.5 41.5 Z"
            />
          </g>
        </g>
      );

    case "equalizer":
      return (
        <g filter={`url(#${labelFilter})`}>
          {[0, 1, 2, 3].map((i) => {
            const x = 39 + i * 7.2;
            const baseY = 58;
            const h0 = 10 + i * 2;
            const y0 = baseY - h0;
            return (
              <rect
                key={i}
                x={x}
                y={y0}
                width="4.2"
                height={h0}
                rx="1.2"
                fill={`url(#${gold})`}
                stroke="#1a0f04"
                strokeWidth="0.25"
              >
                <animate
                  attributeName="height"
                  values={`${h0};${18 + i * 2};${7 + i};${h0}`}
                  keyTimes="0;0.35;0.7;1"
                  dur={`${0.88 + i * 0.1}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                />
                <animate
                  attributeName="y"
                  values={`${y0};${baseY - 18 - i * 2};${baseY - 7 - i};${y0}`}
                  keyTimes="0;0.35;0.7;1"
                  dur={`${0.88 + i * 0.1}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                />
              </rect>
            );
          })}
        </g>
      );

    case "crown":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.4"
            strokeLinejoin="round"
            d="M 50 30 L 54 38 L 62 32 L 60 44 L 40 44 L 38 32 L 46 38 Z"
          />
          <path fill="#2a1a06" opacity="0.35" d="M 40 44 L 60 44 L 58 48 L 42 48 Z" />
        </g>
      );

    case "starburst":
      return (
        <g filter={`url(#${labelFilter})`}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <path
              key={deg}
              fill={`url(#${gold})`}
              opacity="0.92"
              d="M 50 50 L 52 34 L 50 32 L 48 34 Z"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="5.5" fill={`url(#${gold})`} stroke={`url(#${goldDeep})`} strokeWidth="0.4" />
        </g>
      );

    case "tonearm":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            d="M 68 32 Q 55 38 50 48"
          />
          <circle cx="68" cy="31" r="2.8" fill={`url(#${gold})`} stroke="#1a0f04" strokeWidth="0.35" />
          <ellipse cx="48" cy="54" rx="4" ry="2.2" fill={`url(#${gold})`} opacity="0.85" transform="rotate(-35 48 54)" />
        </g>
      );

    case "pulse":
      return (
        <g filter={`url(#${labelFilter})`}>
          {[12, 8, 4.5].map((r, i) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={`url(#${gold})`}
              strokeWidth="0.9"
              opacity={0.5 - i * 0.12}
            >
              <animate
                attributeName="opacity"
                values={`${0.55 - i * 0.12};${0.15 - i * 0.03};${0.55 - i * 0.12}`}
                dur="1.4s"
                begin={`${i * 0.2}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.45 0 0.25 1;0.45 0 0.25 1"
              />
            </circle>
          ))}
          <circle cx="50" cy="50" r="2.8" fill={`url(#${gold})`} />
        </g>
      );

    case "monogram":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M 55 56 C 42 56 38 48 38 40 C 38 33 43 29 49 29"
          />
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M 52 29 H 60 V 44 H 52 M 52 36 H 58 M 52 44 V 56 H 60"
          />
        </g>
      );

    case "facets":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.35"
            strokeLinejoin="round"
            d="M 50 31 L 61 40 L 57 55 L 43 55 L 39 40 Z"
          />
          <path fill="#fff" fillOpacity="0.22" d="M 50 31 L 61 40 L 50 44 Z" />
          <path fill="#000" fillOpacity="0.2" d="M 61 40 L 57 55 L 50 44 Z" />
          <path fill="#fff" fillOpacity="0.08" d="M 43 55 L 57 55 L 50 44 Z" />
        </g>
      );

    case "mic":
      return (
        <g filter={`url(#${labelFilter})`}>
          <rect x="46.2" y="28" width="7.6" height="22" rx="3.8" fill={`url(#${gold})`} stroke="#1a0f04" strokeWidth="0.35" />
          <line x1="42" y1="36" x2="46" y2="36" stroke={`url(#${gold})`} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="42" y1="40" x2="46" y2="40" stroke={`url(#${gold})`} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="42" y1="44" x2="46" y2="44" stroke={`url(#${gold})`} strokeWidth="1.8" strokeLinecap="round" />
          <path fill="none" stroke={`url(#${gold})`} strokeWidth="2.2" strokeLinecap="round" d="M 50 50 V 58 M 45 58 H 55" />
        </g>
      );

    case "cocktail":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            fillOpacity="0.25"
            stroke={`url(#${gold})`}
            strokeWidth="1.8"
            strokeLinejoin="round"
            d="M 38 34 H 62 L 50 54 Z"
          />
          <line x1="50" y1="54" x2="50" y2="62" stroke={`url(#${gold})`} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="44" y1="62" x2="56" y2="62" stroke={`url(#${gold})`} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="52" cy="38" r="2.2" fill="#fffcef" fillOpacity="0.5" />
        </g>
      );

    case "moon":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.35"
            d="M 52 29 C 40 29 32 39 32 50 C 32 61 40 71 52 71 C 46 68 42 60 42 50 C 42 40 46 32 52 29 Z"
          />
          <path fill="#fff" fillOpacity="0.15" d="M 38 44 Q 40 50 38 56" />
        </g>
      );

    case "infinity":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M 48 50 C 36 34 24 38 24 50 C 24 62 36 66 48 50 M 52 50 C 64 34 76 38 76 50 C 76 62 64 66 52 50"
          />
        </g>
      );

    case "adapter":
      return (
        <g filter={`url(#${labelFilter})`}>
          <circle cx="50" cy="50" r="6" fill={`url(#${gold})`} stroke="#1a0f04" strokeWidth="0.4" />
          {[0, 72, 144, 216, 288].map((deg) => (
            <rect
              key={deg}
              x="48.5"
              y="30"
              width="3"
              height="14"
              rx="1"
              fill={`url(#${gold})`}
              stroke="#1a0f04"
              strokeWidth="0.2"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
        </g>
      );

    case "heartbeat":
      /* דופק — מד BPM / אקולייזר (נראה שונה לחלוטין מקו ECG) */
      return (
        <g filter={`url(#${labelFilter})`}>
          {(
            [
              [34.3, 10],
              [39, 14],
              [43.7, 18],
              [48.4, 25],
              [53.1, 18],
              [57.8, 14],
              [62.5, 10],
            ] as const
          ).map(([x, h], i) => (
            <rect
              key={i}
              x={x}
              y={56 - h}
              width="3.2"
              height={h}
              rx="1.35"
              fill={`url(#${gold})`}
              stroke="#1a0f04"
              strokeWidth="0.22"
            />
          ))}
          <circle cx="50" cy="27.5" r="2.5" fill={`url(#${goldDeep})`} stroke={`url(#${gold})`} strokeWidth="0.42" />
          <circle cx="50" cy="27.5" r="0.9" fill="#fff8e8" fillOpacity="0.5" />
        </g>
      );

    case "flame":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.35"
            strokeLinejoin="round"
            d="M 50 28 Q 58 38 56 48 Q 58 58 50 62 Q 42 58 44 48 Q 42 38 50 28 Z"
          />
          <path fill="#fff8dc" fillOpacity="0.35" d="M 50 36 Q 54 44 50 54 Q 46 44 50 36 Z" />
        </g>
      );

    case "wings":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.3"
            d="M 50 42 L 36 32 Q 30 44 34 56 Q 42 52 50 48 Z"
          />
          <path
            fill={`url(#${gold})`}
            stroke="#1a0f04"
            strokeWidth="0.3"
            d="M 50 42 L 64 32 Q 70 44 66 56 Q 58 52 50 48 Z"
          />
          <ellipse cx="50" cy="46" rx="3" ry="5" fill={`url(#${goldDeep})`} opacity="0.6" />
        </g>
      );

    case "spiral":
      return (
        <g filter={`url(#${labelFilter})`}>
          <path
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            d="M 50 35 A 15 15 0 0 1 65 50 A 11 11 0 0 1 50 61 A 7 7 0 0 1 57 50 A 4 4 0 0 1 50 54"
          />
          <circle cx="50" cy="50" r="1.8" fill={`url(#${gold})`} />
        </g>
      );

    case "sparkles":
      return (
        <g filter={`url(#${labelFilter})`}>
          {[
            { x: 50, y: 36, s: 1.2 },
            { x: 38, y: 48, s: 0.9 },
            { x: 62, y: 52, s: 1 },
          ].map((p, i) => (
            <path
              key={i}
              fill={`url(#${gold})`}
              stroke="#1a0f04"
              strokeWidth="0.2"
              d={`M ${p.x} ${p.y - 6 * p.s} L ${p.x + 1.2 * p.s} ${p.y - 1.2 * p.s} L ${p.x + 6 * p.s} ${p.y} L ${p.x + 1.2 * p.s} ${p.y + 1.2 * p.s} L ${p.x} ${p.y + 6 * p.s} L ${p.x - 1.2 * p.s} ${p.y + 1.2 * p.s} L ${p.x - 6 * p.s} ${p.y} L ${p.x - 1.2 * p.s} ${p.y - 1.2 * p.s} Z`}
            />
          ))}
          <circle cx="50" cy="56" r="2.2" fill={`url(#${gold})`} opacity="0.9" />
        </g>
      );

    case "north":
      return (
        <g filter={`url(#${labelFilter})`}>
          <circle cx="50" cy="50" r="17.5" fill="none" stroke={`url(#${gold})`} strokeWidth="1.15" opacity="0.9" />
          {[0, 90, 180, 270].map((deg, i) => (
            <line
              key={deg}
              x1="50"
              y1="33"
              x2="50"
              y2={i === 0 ? 36.5 : 35}
              stroke={`url(#${i === 0 ? gold : goldDeep})`}
              strokeWidth={i === 0 ? 2.2 : 1.1}
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
          <text
            x={50}
            y={31.5}
            textAnchor="middle"
            fill={`url(#${gold})`}
            stroke="#120a02"
            strokeWidth={0.12}
            paintOrder="stroke fill"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "9px", fontWeight: 800 }}
          >
            צ
          </text>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-5 50 50; 6 50 50; -5 50 50"
              keyTimes="0;0.5;1"
              dur="2.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.42 0 0.2 1; 0.42 0 0.2 1"
            />
            <path
              fill={`url(#${gold})`}
              stroke="#1a0f04"
              strokeWidth="0.25"
              strokeLinejoin="round"
              d="M 50 50 L 53.5 48 L 50 31 L 46.5 48 Z"
            />
            <path
              fill={`url(#${goldDeep})`}
              stroke="#1a0f04"
              strokeWidth="0.25"
              strokeLinejoin="round"
              opacity="0.88"
              d="M 50 50 L 53.5 52 L 50 69 L 46.5 52 Z"
            />
            <circle cx="50" cy="50" r="2.2" fill="#0a0a0a" stroke={`url(#${gold})`} strokeWidth="0.35" />
          </g>
        </g>
      );

    default:
      return null;
  }
}

type Props = {
  className?: string;
  /** ברירת מחדל: north (מצפן). ל־CB / C / דופק: centerVariant המתאים */
  centerVariant?: LogoCenterVariant;
};

/** לוגו CLUBING — תקליט ויניל: מסגרת זהב, מרכז לפי centerVariant */
export function ClubingLogoIcon({ className = "w-7 h-7", centerVariant = "north" }: Props) {
  const raw = useId().replace(/:/g, "");
  const gold = `cv-au-${raw}`;
  const goldDeep = `cv-ad-${raw}`;
  const vinyl = `cv-vn-${raw}`;
  const shine = `cv-sh-${raw}`;
  const labelFilter = `cv-lf-${raw}`;
  const ff = displayLabel.style.fontFamily;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="18%" y1="5%" x2="82%" y2="95%">
          <stop offset="0%" stopColor="#fffce8" />
          <stop offset="0.18" stopColor="#f3e5a8" />
          <stop offset="0.45" stopColor="#d4af37" />
          <stop offset="0.72" stopColor="#a67c00" />
          <stop offset="100%" stopColor="#5c420a" />
        </linearGradient>
        <linearGradient id={goldDeep} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c547" />
          <stop offset="1" stopColor="#8a6b1a" />
        </linearGradient>
        <radialGradient id={vinyl} cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#2d2d2d" />
          <stop offset="0.4" stopColor="#101010" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <linearGradient id={shine} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={labelFilter} x="-45%" y="-45%" width="190%" height="190%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="1.1" stdDeviation="0.75" floodColor="#1a0800" floodOpacity="0.5" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="49" fill={`url(#${gold})`} />
      <circle cx="50" cy="50" r="46.8" fill={`url(#${vinyl})`} />

      {[23.5, 25.5, 27.5, 29.5, 31.6, 33.7, 35.8, 37.9, 40, 42.1, 44.2].map((r, i) => (
        <circle
          key={r}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#d4af37"
          strokeWidth={0.15 + (i % 2) * 0.1}
          opacity={0.06 + (i % 3) * 0.015}
        />
      ))}

      <ellipse
        cx="37"
        cy="33"
        rx="26"
        ry="20"
        fill={`url(#${shine})`}
        transform="rotate(-26 50 50)"
      />

      <circle cx="50" cy="50" r="22" fill="#050505" />
      <circle cx="50" cy="50" r="21.2" fill="none" stroke={`url(#${gold})`} strokeOpacity="0.35" strokeWidth="0.5" />

      <LogoCenter variant={centerVariant} gold={gold} goldDeep={goldDeep} labelFilter={labelFilter} ff={ff} />

      <circle cx="50" cy="50" r="3.4" fill="#000" stroke={`url(#${goldDeep})`} strokeWidth="0.55" />
      <circle cx="50" cy="50" r="1.4" fill="#1a1206" />
    </svg>
  );
}
