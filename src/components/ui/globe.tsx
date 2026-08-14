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

// Canvas 2D globe (no WebGL) -> renders everywhere, never crashes.
// Sphere wireframe + markers are rotated in real 3D so it spins like the old cobe globe.

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
    for (let i = 0; i < 60; i++) {
      markers.push({
        lat: -Math.PI / 2 + rnd() * Math.PI,
        lon: -Math.PI + rnd() * 2 * Math.PI,
        size: 2.2 + rnd() * 2.4,
      });
    }

    // Precompute grid samples (unit sphere)
    const latLines: { y: number; cos: number; sin: number }[] = [];
    for (let i = 1; i < 7; i++) {
      const lat = -Math.PI / 2 + (Math.PI * i) / 8;
      latLines.push({ y: Math.sin(lat), cos: Math.cos(lat), sin: 0 });
    }
    const lonLines: { sin: number; cos: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const lon = (Math.PI * 2 * i) / 12;
      lonLines.push({ sin: Math.sin(lon), cos: Math.cos(lon) });
    }
    const STEP = 60;

    const [bR, bG, bB] = toRgb(baseColor);
    const [mR, mG, mB] = toRgb(markerColor);
    const [gR, gG, gB] = toRgb(glowColor);

    // 3D point rotate: Y by phi, then X by theta
    const rotY = (x: number, y: number, z: number, phi: number): [number, number, number] => [
      x * Math.cos(phi) + z * Math.sin(phi),
      y,
      -x * Math.sin(phi) + z * Math.cos(phi),
    ];
    const rotX = (x: number, y: number, z: number, t: number): [number, number, number] => [
      x,
      y * Math.cos(t) - z * Math.sin(t),
      y * Math.sin(t) + z * Math.cos(t),
    ];

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      phiRef.current += 0.004;
      const phi = phiRef.current;
      const { w, h } = sizeRef.current;
      if (w <= 10 || h <= 10) return;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.46 * scale;
      const darkAmt = Math.max(0, Math.min(1, darkRef.current));

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.4);
      glow.addColorStop(0, `rgba(${gR * 255},${gG * 255},${gB * 255},0.30)`);
      glow.addColorStop(1, `rgba(${gR * 255},${gG * 255},${gB * 255},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Sphere base
      const sphere = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.1, cx, cy, R);
      sphere.addColorStop(0, `rgba(${Math.min(255, bR * 255 + 70)},${Math.min(255, bG * 255 + 70)},${Math.min(255, bB * 255 + 70)},1)`);
      sphere.addColorStop(0.45, `rgb(${bR * 255},${bG * 255},${bB * 255})`);
      sphere.addColorStop(1, `rgb(${Math.max(0, (bR - darkAmt * 0.6) * 220)},${Math.max(0, (bG - darkAmt * 0.6) * 220)},${Math.max(0, (bB - darkAmt * 0.6) * 220)})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      const lineAlpha = 0.12 + mapBrightness / 250;

      // Latitude lines (rotated, front-facing only)
      ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
      ctx.lineWidth = 1;
      for (const line of latLines) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= STEP; s++) {
          const beta = (Math.PI * 2 * s) / STEP;
          const [x, y, z] = rotY(line.cos * Math.cos(beta), line.y, line.cos * Math.sin(beta), phi);
          const [, , zz] = rotX(x, y, z, theta);
          if (zz <= 0) {
            started = false;
            continue;
          }
          const px = cx + x * R;
          const py = cy + rotX(x, y, z, theta)[1] * R;
          if (started) ctx.lineTo(px, py);
          else {
            ctx.moveTo(px, py);
            started = true;
          }
        }
        ctx.stroke();
      }

      // Longitude lines (rotated, front-facing only)
      ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
      for (const line of lonLines) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= STEP; s++) {
          const u = (Math.PI * s) / STEP;
          const [x, y, z] = rotY(Math.sin(u) * line.cos, Math.cos(u), Math.sin(u) * line.sin, phi);
          const [xx, , zz] = rotX(x, y, z, theta);
          if (zz <= 0) {
            started = false;
            continue;
          }
          const px = cx + xx * R;
          const py = cy + rotX(x, y, z, theta)[1] * R;
          if (started) ctx.lineTo(px, py);
          else {
            ctx.moveTo(px, py);
            started = true;
          }
        }
        ctx.stroke();
      }

      // Markers (3D rotated, front face only)
      for (const m of markers) {
        const cosLat = Math.cos(m.lat);
        const [x0, y0, z0] = [R * cosLat * Math.cos(m.lon), R * Math.sin(m.lat), R * cosLat * Math.sin(m.lon)];
        const [x1, y1, z1] = rotY(x0, y0, z0, phi);
        const [, , z2] = rotX(x1, y1, z1, theta);
        if (z2 <= 0) continue;
        const depth = 0.45 + 0.55 * (z2 / R);
        const px = cx + rotX(x1, y1, z1, theta)[0];
        const py = cy + rotX(x1, y1, z1, theta)[1];
        ctx.beginPath();
        ctx.arc(px, py, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mR * 255},${mG * 255},${mB * 255},${0.95 * depth})`;
        ctx.shadowColor = `rgba(${mR * 255},${mG * 255},${mB * 255},${0.85 * depth})`;
        ctx.shadowBlur = m.size * 2;
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
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
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