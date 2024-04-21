import { Game, useGames } from "@/lib/games";
import { Crown, ExternalLink, Satellite } from "lucide-react";
import { Button } from "@/components/Theme/Button";
import { Link } from "react-router-dom";
import { useSelf } from "@/lib/users";
import { Tooltip } from "@/components/Theme/Tooltip";

function GameItem({ game }: { game: Game }) {
  const user = useSelf();

  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
          {user?.id === game.owner && (
            <Tooltip content="You started this game">
              <Crown className="text-yellow-400" size={14} />
            </Tooltip>
          )}
          <p>{game.name}</p>
        </div>
        <p className="text-sm text-gray-400">{game.members.length} players</p>
      </div>
      <Link to={`/app/games/${game.id}`}>
        <Button variant="outline" icon={<ExternalLink size={14} />}>
          {game.started_at || game.members.find((m) => m.user === user?.id)
            ? "View"
            : "Join"}
        </Button>
      </Link>
    </div>
  );
}

export function GalaxyLayout() {
  const games = useGames();

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="max-w-[35rem] w-full primary-panel-solid p-4 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xl">Ongoing Games</h1>
          <Link to="/app/new">
            <Button variant="vibrant">Create Game</Button>
          </Link>
        </div>
        <hr className="opacity-10" />
        {games.length === 0 && (
          <div className="my-24 w-full flex flex-col items-center justify-center gap-3 select-none">
            <Satellite
              className=" text-white opacity-20"
              strokeWidth={1}
              size={82}
            />
            <p className="opacity-20 text-sm">No games found</p>
          </div>
        )}

        {games.map((game, i) => (
          <>
            <GameItem game={game} key={game.id} />
            {i < games.length - 1 && (
              <hr className="opacity-10" key={keys(game.id, "divider")} />
            )}
          </>
        ))}
      </div>
    </div>
  );
}
