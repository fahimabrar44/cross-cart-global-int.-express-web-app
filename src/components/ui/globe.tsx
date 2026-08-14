"use client";
import { useEffect, useRef } from "react";
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

// NOTE: This globe uses Canvas 2D (no WebGL) so it renders everywhere,
// including headless/VM browsers where WebGL contexts return null.

const toRgb = (color?: [number, number, number] | string): [number, number, number] => {
  if (typeof color === "string") {
    const clean = color.replace("#", "");
    if (clean.length === 3)
      return [
        parseInt(clean[0] + clean[0], 16) / 255,
        parseInt(clean[1] + clean[1], 16) / 255,
        parseInt(clean[2] + clean[2], 16) / 255,
      ];
    if (clean.length === 6)
      return [
        parseInt(clean.substring(0, 2), 16) / 255,
        parseInt(clean.substring(2, 4), 16) / 255,
        parseInt(clean.substring(4, 6), 16) / 255,
      ];
    return [1, 1, 1];
  }
  if (Array.isArray(color) && color.length === 3) return color;
  return [1, 1, 1];
};

const Globe: React.FC<GlobeProps> = ({
  className,
  theta = 0.25,
  dark = 0,
  scale = 1.1,
  mapBrightness = 10,
  baseColor = "#ffffff",
  markerColor = "#ff0000",
  glowColor = "#ffffff",
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const sizeRef = useRef({ w: 600, h: 600 });
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const size = Math.round(Math.max(20, Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: size, h: size };
    };
    resize();
    window.addEventListener("resize", resize);

    // Deterministic pseudo-random marker positions
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const markers: { lat: number; lon: number; size: number }[] = [];
    for (let i = 0; i < 40; i++) {
      markers.push({
        lat: -Math.PI / 2 + rnd() * Math.PI,
        lon: -Math.PI + rnd() * 2 * Math.PI,
        size: 2.4 + rnd() * 2.4,
      });
    }

    const [bR, bG, bB] = toRgb(baseColor);
    const [mR, mG, mB] = toRgb(markerColor);
    const [gR, gG, gB] = toRgb(glowColor);

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      phiRef.current += 0.0035;
      const phi = phiRef.current;
      const { w, h } = sizeRef.current;
      if (w <= 10 || h <= 10) return;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.46 * scale;
      const darkAmt = Math.max(0, Math.min(1, darkRef.current));

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.35);
      glow.addColorStop(0, `rgba(${gR * 255},${gG * 255},${gB * 255},0.28)`);
      glow.addColorStop(1, `rgba(${gR * 255},${gG * 255},${gB * 255},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Sphere base with highlight
      const sphere = ctx.createRadialGradient(
        cx - R * 0.38,
        cy - R * 0.42,
        R * 0.1,
        cx,
        cy,
        R
      );
      sphere.addColorStop(0, `rgba(${Math.min(255, bR * 255 + 70)},${Math.min(255, bG * 255 + 70)},${Math.min(255, bB * 255 + 70)},1)`);
      sphere.addColorStop(0.45, `rgb(${bR * 255},${bG * 255},${bB * 255})`);
      sphere.addColorStop(1, `rgb(${bR * (1 - darkAmt) * 220},${bG * (1 - darkAmt) * 220},${bB * (1 - darkAmt) * 220})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Latitude + longitude wireframe
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = `rgba(255,255,255,${0.10 + mapBrightness / 300})`;
      ctx.lineWidth = 1;
      for (let i = 1; i < 7; i++) {
        const y = cy - R + (2 * R * i) / 8;
        ctx.beginPath();
        ctx.ellipse(cx, y + R / 8, Math.sqrt(R * R - (y - cy) * (y - cy)) || 1, R / 16, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = -5; i <= 5; i++) {
        const rx = Math.abs(Math.cos((i * Math.PI) / 12)) * R;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(rx, 2), R, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Rotating marker dots (Y-axis rotation, front face only)
      for (const m of markers) {
        const cosLat = Math.cos(m.lat);
        const x0 = R * cosLat * Math.cos(m.lon);
        const z0 = R * cosLat * Math.sin(m.lon);
        const yRot = R * Math.sin(m.lat);
        const xr = x0 * Math.cos(phi) - z0 * Math.sin(phi);
        const zr = x0 * Math.sin(phi) + z0 * Math.cos(phi);
        if (zr < 0) continue;
        const shadow = 0.55 + 0.45 * (zr / R);
        const px = cx + xr;
        const py = cy + yRot * Math.cos(theta);
        ctx.beginPath();
        ctx.arc(px, py, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mR * 255},${mG * 255},${mB * 255},${0.9 * shadow})`;
        ctx.shadowColor = `rgba(${mR * 255},${mG * 255},${mB * 255},${0.8 * shadow})`;
        ctx.shadowBlur = m.size * 1.8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Edge shading
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
      const edge = ctx.createRadialGradient(cx - R, cy - R, R * 0.2, cx, cy, R);
      edge.addColorStop(0, "rgba(255,255,255,0)");
      edge.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = edge;
      ctx.fill();
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={cn("pointer-events-none select-none flex items-center justify-center", className)}
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Globe;