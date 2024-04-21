import { JoinGame } from "@/components/JoinGame";
import { Button } from "@/components/Theme/Button";
import {
  GameState,
  fetchGames,
  getGameState,
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

export function GameLayout() {
  const { gameId } = useParams();
  const user = useSelf();
  const game = useGame(gameId);
  const state = getGameState(game);
  const isJoinable = useIsGameJoinable(game);
  const [startLoading, setStartLoading] = useState(false);

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
    return <p>No game...</p>;
  }

  if (isJoinable) {
    return <JoinGame gameId={gameId} game={game} />;
  }

  if (state === GameState.Running) {
    return <Map game={game} />;
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="max-w-[35rem] w-full primary-panel-solid p-4 flex flex-col gap-5">
        <Link to="/app">
          <Button variant="nobg" icon={<ArrowLeft size={14} />}>
            Back to Galaxy
          </Button>
        </Link>
        <div className="my-24 w-full flex flex-col items-center justify-center gap-3 select-none">
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

          {state === GameState.Ready &&
            (game.owner === user?.id ? (
              <Button
                variant="vibrant"
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
                Start Game
              </Button>
            ) : (
              <p className="opacity-20 text-sm">Waiting for game to start</p>
            ))}
        </div>
      </div>
    </div>
  );
}
