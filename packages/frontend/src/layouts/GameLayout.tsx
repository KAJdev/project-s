import { JoinGame } from "@/components/JoinGame";
import { Button } from "@/components/Theme/Button";
import {
  GameState,
  fetchGames,
  getGameState,
  mockGame,
  startGame,
  useGame,
  useIsGameJoinable,
} from "@/lib/games";
import { fetchScan } from "@/lib/scan";
import { useSelf } from "@/lib/users";
import { motion } from "framer-motion";
import { ArrowLeft, Orbit } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Map } from "@/components/Map";
import { LeftInspector } from "@/components/LeftInspector";

export function GameLayout() {
  const { gameId } = useParams();
  const user = useSelf();
  const game = useGame(gameId);
  const state = getGameState(game);
  const isJoinable = useIsGameJoinable(game);
  const [startLoading, setStartLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);

  useEffect(() => {
    if (state === GameState.Running || state === GameState.Finished) {
      return;
    }

    const interval = setInterval(() => {
      fetchGames();
    }, 30000);

    return () => clearInterval(interval);
  }, [state]);

  if (!gameId || !game) {
    return null;
  }

  if (isJoinable) {
    return <JoinGame gameId={gameId} game={game} />;
  }

  if (state === GameState.Running) {
    return (
      <>
        <div className="w-screen max-h-full h-full min-h-0 flex justify-between sm:p-8 absolute z-10 pointer-events-none">
          <LeftInspector />
        </div>
        <Map game={game} />
      </>
    );
  }

  return (
    <div className="w-dvw min-h-dvh flex items-end sm:items-center justify-center">
      <div className="max-w-[35rem] w-full h-full sm:h-fit primary-panel-solid p-4 flex flex-col gap-5">
        <Link to="/app">
          <Button variant="nobg" icon={<ArrowLeft size={14} />}>
            Back to Galaxy
          </Button>
        </Link>
        <div className="my-24 w-full h-full sm:h-fit flex flex-col items-center justify-center gap-3 select-none">
          <motion.div
            initial={{ rotate: 360 }}
            animate={{ rotate: 0 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          >
            <Orbit
              className=" text-white opacity-20"
              strokeWidth={1}
              size={82}
            />
          </motion.div>
          {state === GameState.Waiting && (
            <>
              <p className="opacity-20 text-sm">
                Waiting for all players to join
              </p>
              <p className="opacity-20 text-sm">
                {game.members.length}/{game.settings.max_players} players
              </p>
            </>
          )}

          {state !== GameState.Ready && game.owner !== user?.id && (
            <p className="opacity-20 text-sm">Waiting for game to start</p>
          )}

          {game.owner === user?.id && (
            <div className="flex gap-2">
              <Button
                variant={state === GameState.Ready ? "vibrant" : "secondary"}
                className="mt-5"
                loading={startLoading}
                onClick={() => {
                  setStartLoading(true);
                  startGame(gameId)
                    .then(() => {
                      setStartLoading(false);
                      fetchGames();
                      fetchScan(gameId);
                    })
                    .catch(() => {
                      setStartLoading(false);
                    });
                }}
              >
                {state === GameState.Ready ? "Start Game" : "Start Anyway"}
              </Button>

              {state !== GameState.Ready && (
                <Button
                  variant={"secondary"}
                  className="mt-5"
                  loading={mockLoading}
                  onClick={() => {
                    setMockLoading(true);
                    mockGame(gameId)
                      .then(() => {
                        setMockLoading(false);
                        fetchGames();
                        fetchScan(gameId);
                      })
                      .catch(() => {
                        setMockLoading(false);
                      });
                  }}
                >
                  Mock Game
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
