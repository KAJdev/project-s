/* eslint-disable @next/next/no-img-element */
import { Sparkle } from "lucide-react";

const COLORS = ["#2056bc", "#bba7be", "#c0aa13", "#c25b00", "#ffa34c"];

export function Star({
  opacity,
  centerAdapt,
  move = true,
  speed = 10,
}: {
  opacity?: number;
  centerAdapt?: boolean;
  index?: number;
  move?: boolean;
  speed?: number;
}) {
  const [loc] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    isFilled: Math.random() > 0.5,
  });

  const [relPos, setRelPos] = useState({
    x: loc.x,
    y: loc.y,
  });

  const centerRelativity = Math.abs(relPos.x - 50) + Math.abs(relPos.y - 50);

  useEffect(() => {
    if (move) {
      const interval = setInterval(() => {
        setRelPos((prev: any) => {
          const newX = prev.x - (50 - prev.x) * 0.0005 * speed;
          const newY = prev.y - (50 - prev.y) * 0.0005 * speed;

          if (Math.abs(newX - 50) > 50 && Math.abs(newY - 50) > 50) {
            return {
              x: 50 + (loc.x - 50) * 0.1,
              y: 50 + (loc.y - 50) * 0.1,
            };
          }

          return {
            x: newX,
            y: newY,
          };
        });
      }, 1000 / 60);

      return () => clearInterval(interval);
    }
  });

  return (
    <div
      className="absolute"
      style={{
        left: `${relPos.x}vw`,
        top: `${relPos.y}vh`,
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
            10
          }px`,
          height: `${
            (centerAdapt ? 1 - Math.max(0.1, 1 - centerRelativity / 50) : 1) *
            10
          }px`,
        }}
      />
    </div>
  );
}
