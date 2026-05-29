import { useEffect, useRef } from "react";

interface CursorGlowProps {
  active?: boolean;
}

export default function CursorGlow({ active = true }: CursorGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -999, y: -999 });
  const currentRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      currentRef.current.x += (posRef.current.x - currentRef.current.x) * 0.1;
      currentRef.current.y += (posRef.current.y - currentRef.current.y) * 0.1;

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
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
      style={{
        zIndex: 2,
        width: 300,
        height: 300,
        background: "radial-gradient(circle, rgba(136,76,255,0.2) 0%, rgba(136,76,255,0.07) 50%, transparent 70%)",
        filter: "blur(20px)",
        borderRadius: "50%",
        willChange: "left, top",
        opacity: active ? 1 : 0,
      }}
    />
  );
}
