"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  alpha: number;
  sides: number;
}

export function CanvasBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let shapes: Shape[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
      initShapes(rect.width, rect.height);
    };

    const initParticles = (w: number, h: number) => {
      particles = [];
      const spacing = 80;
      const cols = Math.floor(w / spacing);
      const rows = Math.floor(h / spacing);
      const offsetX = (w - cols * spacing) / 2;
      const offsetY = (h - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;
          particles.push({
            x, y,
            baseX: x,
            baseY: y,
            vx: 0, vy: 0,
            size: 1.5,
            alpha: 0.06 + Math.random() * 0.08,
          });
        }
      }
    };

    const initShapes = (w: number, h: number) => {
      shapes = [];
      const count = 12;
      for (let i = 0; i < count; i++) {
        shapes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.005,
          size: 20 + Math.random() * 40,
          alpha: 0.08 + Math.random() * 0.08,
          sides: [3, 4, 5, 6][Math.floor(Math.random() * 4)],
        });
      }
    };

    const drawDarkMode = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const repulseRadius = 120;

      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulseRadius && dist > 0) {
          const force = (repulseRadius - dist) / repulseRadius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 2;
          p.vy += Math.sin(angle) * force * 2;
        }

        // Spring back to base
        const sx = p.baseX - p.x;
        const sy = p.baseY - p.y;
        p.vx += sx * 0.02;
        p.vy += sy * 0.02;

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;

        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      }
    };

    const drawPolygon = (
      cx: number,
      cy: number,
      size: number,
      sides: number,
      rotation: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = rotation + (Math.PI * 2 * i) / sides;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const drawLightMode = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const repulseRadius = 150;

      const colors = ["#5aaca7", "#a688bf", "#d4a843", "#7da882", "#cc6b8a"];

      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulseRadius && dist > 0) {
          const force = (repulseRadius - dist) / repulseRadius;
          const angle = Math.atan2(dy, dx);
          s.vx += Math.cos(angle) * force * 0.5;
          s.vy += Math.sin(angle) * force * 0.5;
        }

        s.vx *= 0.995;
        s.vy *= 0.995;
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;

        // Wrap around
        if (s.x < -s.size) s.x = w + s.size;
        if (s.x > w + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = h + s.size;
        if (s.y > h + s.size) s.y = -s.size;

        const color = colors[i % colors.length];
        drawPolygon(s.x, s.y, s.size, s.sides, s.rotation);
        ctx.fillStyle = color + Math.round(s.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (themeRef.current === "dark") {
        drawDarkMode(w, h);
      } else {
        drawLightMode(w, h);
      }

      animId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resize();
    animate();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 0 }}
    />
  );
}
