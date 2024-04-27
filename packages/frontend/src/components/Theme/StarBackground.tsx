import { Star } from "./Star";

export function StarBackground({
  opacity = 1,
  centerAdapt,
  count = 100,
  move = true,
}: {
  opacity?: number;
  centerAdapt?: boolean;
  count?: number;
  move?: boolean;
}) {
  return (
    <div
      className="absolute w-screen h-screen overflow-hidden pointer-events-none -z-10"
      style={{ opacity }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} index={i} centerAdapt={centerAdapt} move={move} />
      ))}
    </div>
  );
}
