/* eslint-disable @next/next/no-img-element */
import { Sparkle } from "lucide-react";

const COLORS = ["#2056bc", "#bba7be", "#c0aa13", "#c25b00", "#ffa34c"];

export function Star({
  opacity,
  centerAdapt,
  index,
}: {
  opacity?: number;
  centerAdapt?: boolean;
  index?: number;
}) {
  const [loc] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    isFilled: Math.random() > 0.5,
  });

  const centerRelativity = Math.abs(loc.x - 50) + Math.abs(loc.y - 50);

  return (
    <div
      className="absolute"
      style={{
        left: `${loc.x}vw`,
        top: `${loc.y}vh`,
      }}
    >
      <img
        src="/star.png"
        alt="star"
        style={{
          opacity:
            opacity ??
            `${Math.min(
              1 - Math.max(0.1, 1 - centerRelativity / 50) * 1.5,
              0.6
            )}`,
          width: `${
            (centerAdapt ? 1 - Math.max(0.1, 1 - centerRelativity / 50) : 1) *
            24
          }px`,
          height: `${
            (centerAdapt ? 1 - Math.max(0.1, 1 - centerRelativity / 50) : 1) *
            24
          }px`,
        }}
      />
    </div>
  );
}
