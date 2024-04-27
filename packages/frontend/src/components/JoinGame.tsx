import { Link } from "react-router-dom";
import { Input } from "./Theme/Input";
import { Button } from "./Theme/Button";
import { Game, fetchGames, joinGame } from "@/lib/games";
import { Label } from "./Theme/Label";
import { fetchScan } from "@/lib/scan";

type PlayerForm = {
  name: string;
  color: string;
};

const colors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export function JoinGame({
  gameId,
  game,
}: {
  gameId: string;
  game: Game | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableColors = colors.filter(
    (c) => !game?.members.map((m) => m.color).includes(c)
  );

  const [gameForm, setGameForm] = useState<PlayerForm>({
    name: "",
    color: availableColors[0] || "#000000",
  });

  if (!game) return <></>;

  return (
    <div className="w-dvw min-h-dvh flex items-end sm:items-center justify-center">
      <div className="max-w-[35rem] w-full primary-panel-solid p-4 gap-5 flex flex-col">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl">Join {game.name}</h1>
          <p className="text-sm opacity-50">
            {game.members.length} / {game.settings.max_players} players
          </p>
        </div>
        <hr className="opacity-10" />
        <div className="flex flex-col gap-3 w-full">
          <Input
            label="Player Name"
            placeholder="Tyranid Fleet"
            value={gameForm.name}
            onChange={(e) => setGameForm({ ...gameForm, name: e })}
          />

          <div className="flex flex-col gap-1 w-full">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {availableColors.map((c) => (
                <button
                  key={c}
                  className={classes(
                    "w-8 h-8 rounded-full border",
                    gameForm.color === c
                      ? "border-white/75"
                      : "border-transparent border opacity-50 hover:opacity-90"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setGameForm({ ...gameForm, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            {error ? <p className="text-red-500 text-sm">{error}</p> : <div />}

            <div className="flex gap-2">
              <Link to="/app">
                <Button variant="danger-transparent">Cancel</Button>
              </Link>
              <Button
                variant="vibrant"
                loading={loading}
                disabled={!gameForm.name}
                onClick={() => {
                  setLoading(true);
                  setError(null);

                  joinGame(gameId, gameForm.name, gameForm.color, null)
                    .then(() => {
                      setLoading(false);
                      fetchGames();
                      fetchScan(gameId);
                    })
                    .catch((e) => {
                      setLoading(false);
                      setError(e.message);
                    });
                }}
              >
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
