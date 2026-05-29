import { useEffect, useRef } from "react";

type SmokePuff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  growRate: number;
};

export default function WaterRippleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const puffsRef = useRef<SmokePuff[]>([]);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(active);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!activeRef.current) return;
      const now = Date.now();
      if (now - lastSpawnRef.current < 18) return;
      lastSpawnRef.current = now;

      // Spawn a cluster of 2-3 soft smoke puffs at cursor
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        puffsRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(0.3 + Math.random() * 0.5), // slight upward drift
          radius: 10 + Math.random() * 14,
          alpha: 0.28 + Math.random() * 0.15,
          growRate: 0.6 + Math.random() * 0.6,
        });
      }

      // Cap total puffs
      if (puffsRef.current.length > 120) {
        puffsRef.current.splice(0, puffsRef.current.length - 120);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter out dead puffs
      puffsRef.current = puffsRef.current.filter(p => p.alpha > 0.005);

      for (const p of puffsRef.current) {
        // Move
        p.x += p.vx;
        p.y += p.vy;
        // Grow and fade
        p.radius += p.growRate;
        p.alpha *= 0.97;
        // Slow drift
        p.vx *= 0.995;
        p.vy *= 0.998;

        // Soft radial gradient — looks like smoke/glow cloud
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0,   `rgba(140, 80, 255, ${p.alpha})`);
        grad.addColorStop(0.35, `rgba(110, 50, 220, ${p.alpha * 0.55})`);
        grad.addColorStop(0.7,  `rgba(80, 30, 180, ${p.alpha * 0.18})`);
        grad.addColorStop(1,    `rgba(60, 20, 140, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
