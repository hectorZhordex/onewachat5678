import CursorGlow from "./cursor-glow";

interface AnimatedBackgroundProps {
  overCard?: boolean;
}

export default function AnimatedBackground({ overCard = false }: AnimatedBackgroundProps) {
  return (
    <>
      {/* Blob 1 — large, top-left */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          background: "#884cff",
          filter: "blur(130px)",
          opacity: 0.26,
          top: "8%", left: "12%",
          zIndex: 0,
          animation: "blob-float-1 16s ease-in-out infinite",
        }}
      />
      {/* Blob 2 — bottom-right */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 350, height: 350,
          background: "#5b2fff",
          filter: "blur(120px)",
          opacity: 0.2,
          bottom: "10%", right: "10%",
          zIndex: 0,
          animation: "blob-float-2 20s ease-in-out infinite",
        }}
      />
      {/* Blob 3 — mid, accent */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 260, height: 260,
          background: "#c040ff",
          filter: "blur(110px)",
          opacity: 0.14,
          top: "52%", left: "58%",
          zIndex: 0,
          animation: "blob-float-3 13s ease-in-out infinite",
        }}
      />
      {/* Blob 4 — top-right small */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 200, height: 200,
          background: "#884cff",
          filter: "blur(100px)",
          opacity: 0.12,
          top: "4%", right: "22%",
          zIndex: 0,
          animation: "blob-float-2 18s ease-in-out infinite reverse",
        }}
      />

      {/* Cursor glow — only active when NOT over card */}
      <CursorGlow active={!overCard} />
    </>
  );
}
