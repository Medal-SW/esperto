import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  dx: number;
  dy: number;
  dr: number;
}

const COLORS = ["#e94560", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899"];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 30,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    dx: (Math.random() - 0.5) * 12,
    dy: -(2 + Math.random() * 6),
    dr: (Math.random() - 0.5) * 15,
  }));
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setParticles(createParticles(50));
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (!visible || particles.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 10 * p.scale,
            height: 10 * p.scale,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall 2.2s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
            opacity: 0,
            ["--dx" as string]: `${p.dx}vw`,
            ["--dy" as string]: `${60 + p.dy * 5}vh`,
            ["--dr" as string]: `${p.rotation + p.dr * 30}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) rotate(var(--dr));
          }
        }
      `}</style>
    </div>
  );
}
