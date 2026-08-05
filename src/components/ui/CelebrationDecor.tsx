import { Crown, Star1 } from "iconsax-react";

import type { CelebrationType } from "../../utils/celebrations";

interface ConfettiPiece {
  left: number;
  top: number;
  size: number;
  rotate: number;
  round: boolean;
  color: string;
}

const COLORS = ["#FBBC05", "#F2592D", "#34A853", "#4285F4", "#8C37C3", "#CD432F"];

const CONFETTI: ConfettiPiece[] = [
  { left: 6, top: 8, size: 7, rotate: 15, round: false, color: COLORS[0] },
  { left: 16, top: 22, size: 6, rotate: 70, round: true, color: COLORS[3] },
  { left: 64, top: 9, size: 8, rotate: 40, round: false, color: COLORS[5] },
  { left: 84, top: 18, size: 6, rotate: -25, round: true, color: COLORS[1] },
  { left: 92, top: 46, size: 7, rotate: 110, round: false, color: COLORS[4] },
  { left: 5, top: 58, size: 6, rotate: -60, round: true, color: COLORS[2] },
  { left: 26, top: 90, size: 7, rotate: 30, round: false, color: COLORS[3] },
  { left: 48, top: 92, size: 6, rotate: 85, round: true, color: COLORS[0] },
  { left: 72, top: 88, size: 8, rotate: -40, round: false, color: COLORS[5] },
  { left: 88, top: 72, size: 6, rotate: 50, round: true, color: COLORS[1] },
  { left: 36, top: 6, size: 6, rotate: 115, round: true, color: COLORS[2] },
  { left: 55, top: 12, size: 5, rotate: -15, round: false, color: COLORS[4] },
  { left: 10, top: 34, size: 5, rotate: 95, round: true, color: COLORS[1] },
  { left: 94, top: 30, size: 6, rotate: -80, round: false, color: COLORS[0] },
  { left: 40, top: 78, size: 5, rotate: 20, round: true, color: COLORS[3] },
  { left: 20, top: 70, size: 7, rotate: 140, round: false, color: COLORS[5] },
];

interface CelebrationDecorProps {
  type: CelebrationType;
  years?: number;
}

export const CelebrationDecor = ({ type, years }: CelebrationDecorProps) => (
  <>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100/80 via-rose-50/50 to-transparent" />
    <div className="pointer-events-none absolute inset-0">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: c.size,
            height: c.round ? c.size : c.size * 2.2,
            background: c.color,
            borderRadius: c.round ? "9999px" : "2px",
            transform: `rotate(${c.rotate}deg)`,
            opacity: 0.85,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          }}
        />
      ))}
    </div>
    <div className="absolute left-3 top-3">
      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-gray900 shadow-sm ring-1 ring-black/5">
        {type === "birthday" ? (
          <Star1 size={12} color="#FBBC05" variant="Bold" />
        ) : (
          <Crown size={12} color="#FBBC05" variant="Bold" />
        )}
        {type === "birthday"
          ? "Birthday"
          : `${years ?? 1} ${years === 1 ? "year" : "years"} · Anniversary`}
      </span>
    </div>
  </>
);