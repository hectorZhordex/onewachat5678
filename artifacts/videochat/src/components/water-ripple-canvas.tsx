import { useEffect, useRef } from "react";

type Ripple = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
};

export default function WaterRippleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(active);
  const lastRippleRef = useRef(0);

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
      // Throttle: one ripple every ~60ms for smooth water feel
      if (now - lastRippleRef.current < 60) return;
      lastRippleRef.current = now;

      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 60 + Math.random() * 50,
        alpha: 0.45 + Math.random() * 0.15,
        speed: 1.2 + Math.random() * 1.5,
      });

      if (ripplesRef.current.length > 40) ripplesRef.current.shift();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.008);

      for (const r of ripplesRef.current) {
        r.radius += r.speed;
        r.alpha *= 0.955;

        // Outer ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(136, 76, 255, ${r.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner ring (offset)
        if (r.radius > 12) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(180, 110, 255, ${r.alpha * 0.45})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
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
