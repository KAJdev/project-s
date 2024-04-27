import { Game, useGames } from "@/lib/games";
import { Crown, ExternalLink, Satellite } from "lucide-react";
import { Button } from "@/components/Theme/Button";
import { Link } from "react-router-dom";
import { useSelf } from "@/lib/users";
import { Tooltip } from "@/components/Theme/Tooltip";
import { Field } from "@/components/Inspector";
import { deleteToken } from "@/lib/token";

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
    <>
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
    </>
  );
}

function ProfileLayout() {
  const user = useSelf();

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Profile</h1>
      </div>
      <hr className="opacity-10" />
      <Field label="Username">{user?.username}</Field>
      <Field label="Email">{user?.email}</Field>
      <Field label="User ID" variant="box">
        {user?.id}
      </Field>
      <Field>
        <Button variant="danger" onClick={deleteToken}>
          Logout
        </Button>
      </Field>
    </>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={classes(
        "p-4 w-full bg-white/5",
        active ? "text-white bg-white/20" : "text-white/75 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

export function HomePage() {
  const [tab, setTab] = useState<"games" | "profile">("games");

  return (
    <div className="w-dvw min-h-dvh flex items-end sm:items-center justify-center">
      <div className="max-w-[35rem] w-full primary-panel-solid flex flex-col">
        <div className="flex border-b border-white/20">
          <TabButton active={tab === "games"} onClick={() => setTab("games")}>
            Games
          </TabButton>
          <TabButton
            active={tab === "profile"}
            onClick={() => setTab("profile")}
          >
            Profile
          </TabButton>
        </div>
        <div className="flex flex-col gap-5 p-4">
          {tab === "games" && <GalaxyLayout />}
          {tab === "profile" && <ProfileLayout />}
        </div>
      </div>
    </div>
  );
}
