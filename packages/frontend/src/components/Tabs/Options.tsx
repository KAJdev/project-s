import { fetchGames, restartGame, useGame } from "@/lib/games";
import { scanStore, usePlayer } from "@/lib/scan";
import { Field } from "../Inspector";
import { Button } from "../Theme/Button";

export function Options() {
  const self = usePlayer();
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);

  return (
    <>
      {game.owner === self?.user && (
        <Field label="Admin">
          <Button onClick={() => restartGame(game.id).then(() => fetchGames())}>
            Restart Game
          </Button>
        </Field>
      )}
    </>
  );
}
