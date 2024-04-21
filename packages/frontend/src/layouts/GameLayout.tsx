import { Star } from "@/components/Theme/Star";
import { useScan } from "@/lib/scan";
import { useParams } from "react-router-dom";

export function GameLayout() {
  const { gameId } = useParams();
  const scan = useScan(gameId);
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
