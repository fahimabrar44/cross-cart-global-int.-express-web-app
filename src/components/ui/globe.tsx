"use client";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

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

const MARKERS: { location: [number, number]; size: number }[] = [
  { location: [23.81, 90.41], size: 0.1 }, // Dhaka
  { location: [51.51, -0.13], size: 0.1 }, // London
  { location: [40.71, -74.01], size: 0.1 }, // New York
  { location: [35.68, 139.69], size: 0.1 }, // Tokyo
  { location: [-33.87, 151.21], size: 0.09 }, // Sydney
  { location: [25.2, 55.27], size: 0.09 }, // Dubai
  { location: [1.35, 103.82], size: 0.09 }, // Singapore
  { location: [43.65, -79.38], size: 0.09 }, // Toronto
  { location: [48.86, 2.35], size: 0.09 }, // Paris
  { location: [50.11, 8.68], size: 0.09 }, // Frankfurt
  { location: [34.05, -118.24], size: 0.09 }, // Los Angeles
  { location: [19.08, 72.88], size: 0.09 }, // Mumbai
  { location: [39.9, 116.41], size: 0.09 }, // Beijing
  { location: [-23.55, -46.63], size: 0.09 }, // Sao Paulo
  { location: [19.43, -99.13], size: 0.09 }, // Mexico City
  { location: [52.52, 13.41], size: 0.09 }, // Berlin
  { location: [41.01, 28.98], size: 0.09 }, // Istanbul
  { location: [21.49, 39.19], size: 0.09 }, // Jeddah
  { location: [3.14, 101.69], size: 0.09 }, // Kuala Lumpur
  { location: [22.32, 114.17], size: 0.09 }, // Hong Kong
  { location: [30.05, 31.24], size: 0.09 }, // Cairo
  { location: [28.61, 77.21], size: 0.09 }, // New Delhi
];

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
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
};

const resolveRgb = (
  color?: [number, number, number] | string,
  fallback: [number, number, number] = [0.4, 0.65, 1],
): [number, number, number] => {
  if (typeof color === "string") return hexToRgb(color);
  if (Array.isArray(color) && color.length === 3) return color;
  return fallback;
};

// ---------------------------------------------------------------------------
// WebGL (cobe) globe - the original 3D look. Fully guarded: if WebGL is
// unavailable OR cobe throws for any reason, we fall back to Canvas 2D.
// ---------------------------------------------------------------------------
const CobeGlobe: React.FC<GlobeProps & { onFallback: () => void }> = ({
  theta,
  dark,
  scale,
  diffuse,
  mapSamples,
  mapBrightness,
  baseColor,
  markerColor,
  glowColor,
  onFallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(theta ?? 0.25);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: unknown = null;
    try {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const size = Math.min(rect?.width || 800, rect?.height || 800) || 800;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const internal = size * dpr;

      canvas.width = internal;
      canvas.height = internal;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: internal,
        height: internal,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: dark ?? 0,
        scale: scale ?? 1.1,
        diffuse: diffuse ?? 1.2,
        mapSamples: mapSamples ?? 60000,
        mapBrightness: mapBrightness ?? 10,
        baseColor: resolveRgb(baseColor, [0.4, 0.65, 1]),
        markerColor: resolveRgb(markerColor, [0.96, 0.77, 0]),
        glowColor: resolveRgb(glowColor, [0.27, 0.57, 0.89]),
        opacity: 1,
        offset: [0, 0],
        markers: MARKERS,
        onRender: (state: Record<string, number>) => {
          if (!isDragging.current) phiRef.current += 0.0035;
          state.phi = phiRef.current;
          state.theta = thetaRef.current;
        },
      });
      globeRef.current = globe;
    } catch {
      onFallback();
      return;
    }

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      canvas.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const speed = 0.005;
      phiRef.current += e.movementX * speed;
      thetaRef.current = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, thetaRef.current - e.movementY * speed),
      );
    };
    const stopDrag = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);

    const handleResize = () => {
      try {
        if (globeRef.current?.destroy) globeRef.current.destroy();
        globeRef.current = null;
        const rect = canvas.parentElement?.getBoundingClientRect();
        const s = Math.min(rect?.width || 800, rect?.height || 800) || 800;
        const dp = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = s * dp;
        canvas.height = s * dp;
        canvas.style.width = `${s}px`;
        canvas.style.height = `${s}px`;
        globeRef.current = createGlobe(canvas, {
          devicePixelRatio: dp,
          width: s * dp,
          height: s * dp,
          phi: phiRef.current,
          theta: thetaRef.current,
          dark: dark ?? 0,
          scale: scale ?? 1.1,
          diffuse: diffuse ?? 1.2,
          mapSamples: mapSamples ?? 60000,
          mapBrightness: mapBrightness ?? 10,
          baseColor: resolveRgb(baseColor, [0.4, 0.65, 1]),
          markerColor: resolveRgb(markerColor, [0.96, 0.77, 0]),
          glowColor: resolveRgb(glowColor, [0.27, 0.57, 0.89]),
          opacity: 1,
          offset: [0, 0],
          markers: MARKERS,
          onRender: (state: Record<string, number>) => {
            if (!isDragging.current) phiRef.current += 0.0035;
            state.phi = phiRef.current;
            state.theta = thetaRef.current;
          },
        });
      } catch {
        onFallback();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      if (globeRef.current?.destroy) {
        try {
          globeRef.current.destroy();
        } catch {
          /* ignore */
        }
      }
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <canvas ref={canvasRef} style={{ display: "block", cursor: "grab" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Canvas 2D fallback - animated shaded globe, no WebGL, never crashes.
// ---------------------------------------------------------------------------
const CanvasGlobe: React.FC<GlobeProps> = ({
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

    const latLines: { y: number; cos: number }[] = [];
    for (let i = 1; i < 7; i++) {
      const lat = -Math.PI / 2 + (Math.PI * i) / 8;
      latLines.push({ y: Math.sin(lat), cos: Math.cos(lat) });
    }
    const lonLines: { sin: number; cos: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const lon = (Math.PI * 2 * i) / 12;
      lonLines.push({ sin: Math.sin(lon), cos: Math.cos(lon) });
    }
    const STEP = 60;

    const [bR, bG, bB] = resolveRgb(baseColor, [1, 1, 1]);
    const [mR, mG, mB] = resolveRgb(markerColor, [1, 0, 0]);
    const [gR, gG, gB] = resolveRgb(glowColor, [1, 1, 1]);

    const rotY = (
      x: number,
      y: number,
      z: number,
      phi: number,
    ): [number, number, number] => [
      x * Math.cos(phi) + z * Math.sin(phi),
      y,
      -x * Math.sin(phi) + z * Math.cos(phi),
    ];
    const rotX = (
      x: number,
      y: number,
      z: number,
      t: number,
    ): [number, number, number] => [
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

      const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.4);
      glow.addColorStop(0, `rgba(${gR * 255},${gG * 255},${gB * 255},0.30)`);
      glow.addColorStop(1, `rgba(${gR * 255},${gG * 255},${gB * 255},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const sphere = ctx.createRadialGradient(
        cx - R * 0.38,
        cy - R * 0.42,
        R * 0.1,
        cx,
        cy,
        R,
      );
      sphere.addColorStop(
        0,
        `rgba(${Math.min(255, bR * 255 + 70)},${Math.min(255, bG * 255 + 70)},${Math.min(255, bB * 255 + 70)},1)`,
      );
      sphere.addColorStop(0.45, `rgb(${bR * 255},${bG * 255},${bB * 255})`);
      sphere.addColorStop(
        1,
        `rgb(${Math.max(0, (bR - darkAmt * 0.6) * 220)},${Math.max(0, (bG - darkAmt * 0.6) * 220)},${Math.max(0, (bB - darkAmt * 0.6) * 220)})`,
      );
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      const lineAlpha = 0.12 + mapBrightness / 250;
      ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
      ctx.lineWidth = 1;
      for (const line of latLines) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= STEP; s++) {
          const beta = (Math.PI * 2 * s) / STEP;
          const [x, y, z] = rotY(
            line.cos * Math.cos(beta),
            line.y,
            line.cos * Math.sin(beta),
            phi,
          );
          const [, , zz] = rotX(x, y, z, theta);
          if (zz <= 0) {
            started = false;
            continue;
          }
          const [px3] = rotX(x, y, z, theta);
          const px = cx + px3 * R;
          const py = cy + rotX(x, y, z, theta)[1] * R;
          if (started) ctx.lineTo(px, py);
          else {
            ctx.moveTo(px, py);
            started = true;
          }
        }
        ctx.stroke();
      }

      for (const line of lonLines) {
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= STEP; s++) {
          const u = (Math.PI * s) / STEP;
          const [x, y, z] = rotY(
            Math.sin(u) * line.cos,
            Math.cos(u),
            Math.sin(u) * line.sin,
            phi,
          );
          const [, , zz] = rotX(x, y, z, theta);
          if (zz <= 0) {
            started = false;
            continue;
          }
          const px = cx + rotX(x, y, z, theta)[0] * R;
          const py = cy + rotX(x, y, z, theta)[1] * R;
          if (started) ctx.lineTo(px, py);
          else {
            ctx.moveTo(px, py);
            started = true;
          }
        }
        ctx.stroke();
      }

      for (const m of markers) {
        const cosLat = Math.cos(m.lat);
        const [x1, y1, z1] = rotY(
          R * cosLat * Math.cos(m.lon),
          R * Math.sin(m.lat),
          R * cosLat * Math.sin(m.lon),
          phi,
        );
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
      className="flex items-center justify-center w-full h-full"
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Globe - probes WebGL support, renders cobe (WebGL) or Canvas 2D.
// ---------------------------------------------------------------------------
const Globe: React.FC<GlobeProps> = (props) => {
  const { className } = props;
  const [mode, setMode] = useState<"webgl" | "canvas2d">("webgl");

  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const ok = !!(
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
      );
      if (!ok) setMode("canvas2d");
    } catch {
      setMode("canvas2d");
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none select-none flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        width: "100%",
        height: "1500px", // Container takes full viewport height
        display: "flex", // Ensure flexbox properties are active for centering
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // Prevent scrollbars if content overflows
      }}
    >
      {mode === "webgl" ? (
        <CobeGlobe {...props} onFallback={() => setMode("canvas2d")} />
      ) : (
        <CanvasGlobe
          {...props}
          
        />
      )}
    </div>
  );
};

export default Globe;
