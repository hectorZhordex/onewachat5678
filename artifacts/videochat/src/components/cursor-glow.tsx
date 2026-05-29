import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -999, y: -999 });
  const currentRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Smooth lerp toward real cursor position
      currentRef.current.x += (posRef.current.x - currentRef.current.x) * 0.12;
      currentRef.current.y += (posRef.current.y - currentRef.current.y) * 0.12;

      if (glowRef.current) {
        glowRef.current.style.left = `${currentRef.current.x}px`;
        glowRef.current.style.top = `${currentRef.current.y}px`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[9998] -translate-x-1/2 -translate-y-1/2"
      style={{
        width: 280,
        height: 280,
        background: "radial-gradient(circle, rgba(136,76,255,0.22) 0%, rgba(136,76,255,0.08) 50%, transparent 70%)",
        filter: "blur(18px)",
        borderRadius: "50%",
        willChange: "left, top",
      }}
    />
  );
}
