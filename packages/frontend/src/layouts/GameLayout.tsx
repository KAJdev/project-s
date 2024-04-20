import { Star } from "@/components/Theme/Star";

export function GameLayout() {
  return (
    <>
      <div className="absolute w-screen h-screen overflow-hidden pointer-events-none">
        {Array.from({ length: 100 }).map((_, i) => (
          <Star key={i} opacity={0.1} />
        ))}
      </div>
    </>
  );
}
