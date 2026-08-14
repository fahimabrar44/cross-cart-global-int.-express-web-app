"use client";
import { cn } from "@/lib/utils";

interface GlobeProps {
  className?: string;
  theta?: number;
  dark?: number;
  scale?: number;
  diffuse?: number;
  mapSamples?: number;
  mapBrightness?: number;
  baseColor?: [number, number, number] | string;
  markerColor?: [number, number, number] | string;
  glowColor?: [number, number, number] | string;
}

const toHex = (color?: [number, number, number] | string): string => {
  if (typeof color === "string") return color;
  if (Array.isArray(color) && color.length === 3) {
    return `rgb(${Math.round(color[0] * 255)},${Math.round(
      color[1] * 255
    )},${Math.round(color[2] * 255)})`;
  }
  return "#ffffff";
};

const Globe: React.FC<GlobeProps> = ({
  className,
  baseColor = "#ffffff",
  markerColor = "#87ceeb",
  glowColor = "#ffffff",
}) => {
  const base = toHex(baseColor);
  const marker = toHex(markerColor);
  const glow = toHex(glowColor);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none select-none overflow-hidden", className)}>
      <div
        className="relative"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(65vmin, 90%)",
          height: "65vmin",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.45) 0%, transparent 45%), radial-gradient(circle, ${base} 0%, ${base} 75%)`,
          boxShadow: `0 0 90px 10px ${glow}55, inset -24px -18px 60px rgba(0,0,0,0.35)`,
        }}
      >
        {/* latitude lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[18, 38, 58, 78].map((top) => (
            <div
              key={top}
              className="absolute right-[8%] left-[8%] border-t border-white/15"
              style={{ top: `${top}%`, transform: `rotate(${3}deg)` }}
            />
          ))}
        </div>
        {/* marker dots */}
        <span
          className="absolute"
          style={{ top: "22%", left: "30%", width: 8, height: 8, borderRadius: "50%", background: marker }}
        />
        <span
          className="absolute"
          style={{ top: "42%", left: "62%", width: 8, height: 8, borderRadius: "50%", background: marker }}
        />
        <span
          className="absolute"
          style={{ top: "66%", left: "38%", width: 8, height: 8, borderRadius: "50%", background: marker }}
        />
        <span
          className="absolute"
          style={{ top: "52%", left: "22%", width: 5, height: 5, borderRadius: "50%", background: marker }}
        />
      </div>
    </div>
  );
};

export default Globe;