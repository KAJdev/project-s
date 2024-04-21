import { Link } from "react-router-dom";
import { Input } from "./Theme/Input";
import { Button } from "./Theme/Button";
import { joinGame } from "@/lib/games";

type PlayerForm = {
  name: string;
  color: string;
};

export function JoinGame({
  gameId,
  game,
}: {
  gameId: string;
  game: Game | null;
}) {
  const [gameForm, setGameForm] = useState<PlayerForm>({
    name: "",
    color: "red",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!game) return <p>Loading...</p>;

  return (
    <div className="w-screen h-screen flex items-center justify-center">
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

          <Input
            label="Color"
            type="color"
            value={gameForm.color}
            onChange={(e) => setGameForm({ ...gameForm, color: e })}
          />
          <div className="flex justify-between items-center gap-2">
            {error ? <p className="text-red-500 text-sm">{error}</p> : <div />}

            <div className="flex gap-2">
              <Link to="/app">
                <Button variant="danger-transparent">Cancel</Button>
              </Link>
              <Button
                variant="vibrant"
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setError(null);

                  joinGame(gameId, gameForm.name, gameForm.color, null)
                    .then(() => {
                      setLoading(false);
                      window.location.href = `/app/game/${gameId}`;
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
