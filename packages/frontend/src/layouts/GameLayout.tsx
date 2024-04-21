import { JoinGame } from "@/components/JoinGame";
import { useGame } from "@/lib/games";
import { useScan } from "@/lib/scan";
import { useParams } from "react-router-dom";

function Map({ gameId }: { gameId: string }) {
  const scan = useScan(gameId);

  return <>{JSON.stringify(scan)}</>;
}

export function GameLayout() {
  const { gameId } = useParams();
  const game = useGame(gameId);
  const scan = useScan(gameId);

  if (!gameId) {
    return <p>No game...</p>;
  }

  if (!scan && game) {
    return <JoinGame gameId={gameId} game={game} />;
  }

  if (scan && game) {
    return <Map gameId={gameId} />;
  }
}
