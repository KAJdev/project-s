import { Game } from "@/lib/games";
import { useScan } from "@/lib/scan";

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);

  return <>{JSON.stringify(scan)}</>;
}
