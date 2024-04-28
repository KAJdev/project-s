import { Button } from "@/components/Theme/Button";
import { Input } from "@/components/Theme/Input";
import {
  GameSettings,
  createGame,
  defaultGameSettings,
  fetchGames,
} from "@/lib/games";
import { Link, useNavigate } from "react-router-dom";

type GameForm = {
  name: string;
  settings: GameSettings;
};

export function NewGameLayout() {
  const nav = useNavigate();
  const [gameForm, setGameForm] = useState<GameForm>({
    name: "",
    settings: defaultGameSettings(),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-dvw min-h-dvh flex items-end sm:items-center justify-center">
      <div className="max-w-[35rem] w-full primary-panel-solid p-4 gap-5 flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-xl">Create Game</h1>
        </div>
        <hr className="opacity-10" />
        <div className="flex flex-col gap-3 w-full">
          <Input
            label="Game Name"
            placeholder="The Chronicles of Nebula"
            value={gameForm.name}
            onChange={(e) => setGameForm({ ...gameForm, name: e })}
          />

          <div className="flex sm:flex-row flex-col gap-3 w-full">
            {/* max players */}
            <Input
              type="number"
              label="Max Players"
              value={gameForm.settings.max_players}
              min={2}
              max={32}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: { ...gameForm.settings, max_players: +e },
                })
              }
            />

            {/* stars per player */}
            <Input
              type="number"
              label="Stars Per Player"
              value={gameForm.settings.stars_per_player}
              min={8}
              max={100}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: { ...gameForm.settings, stars_per_player: +e },
                })
              }
            />

            {/* star victory percentage */}
            <Input
              type="number"
              label="Star Victory Percentage"
              value={gameForm.settings.star_victory_percentage}
              icon="%"
              min={1}
              max={100}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: {
                    ...gameForm.settings,
                    star_victory_percentage: +e,
                  },
                })
              }
            />
          </div>

          <div className="flex sm:flex-row flex-col gap-3 w-full">
            {/* production cycle length */}
            <Input
              type="number"
              label="Production Cycle Length"
              value={gameForm.settings.production_cycle_length}
              icon="hours"
              min={1}
              max={48}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: {
                    ...gameForm.settings,
                    production_cycle_length: +e,
                  },
                })
              }
            />

            {/* trading level cost */}
            <Input
              type="number"
              label="Trading Level Cost"
              value={gameForm.settings.trading_level_cost}
              icon="$"
              min={1}
              max={1000}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: {
                    ...gameForm.settings,
                    trading_level_cost: +e,
                  },
                })
              }
            />
          </div>
          <div className="flex sm:flex-row flex-col gap-3 w-full">
            {/* starting cash */}
            <Input
              type="number"
              label="Starting Cash"
              value={gameForm.settings.starting_cash}
              icon="$"
              min={10}
              max={10000}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: {
                    ...gameForm.settings,
                    starting_cash: +e,
                  },
                })
              }
            />

            {/* starting ships */}
            <Input
              type="number"
              label="Starting Ships"
              value={gameForm.settings.starting_ships}
              icon="🚀"
              min={1}
              max={1000}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: {
                    ...gameForm.settings,
                    starting_ships: +e,
                  },
                })
              }
            />
          </div>
          <div className="flex sm:flex-row flex-col gap-3 w-full">
            {/* carrier speed */}
            <Input
              type="number"
              label="Normal Carrier Speed"
              value={gameForm.settings.carrier_speed}
              icon="LY/h"
              min={0.1}
              max={100}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: { ...gameForm.settings, carrier_speed: +e },
                })
              }
            />

            {/* warp speed */}
            <Input
              type="number"
              label="Carrier Warp Speed"
              value={gameForm.settings.warp_speed}
              icon="LY/h"
              min={0.1}
              max={100}
              step={0.1}
              onChange={(e) =>
                setGameForm({
                  ...gameForm,
                  settings: { ...gameForm.settings, warp_speed: +e },
                })
              }
            />
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

                createGame(gameForm.name, gameForm.settings).then((game) => {
                  setLoading(false);
                  if (!game) {
                    setError("Failed to create game");
                  } else {
                    fetchGames();
                    nav(`/app/games/${game.id}`);
                  }
                });
              }}
            >
              Create Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
