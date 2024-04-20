import { Game, useGames } from "@/lib/games";
import { motion } from "framer-motion";
import { Galaxy } from "@/components/Icons/Galaxy";
import { Satellite } from "lucide-react";
import { Button } from "@/components/Theme/Button";
import { StarBackground } from "@/components/Theme/StarBackground";
import { Link } from "react-router-dom";

type GalaxyNode = { id: ID; x: number; y: number; fx?: number; fy?: number };

const COLORS = ["#2056bc", "#bba7be", "#c0aa13", "#c25b00", "#ffa34c"];

function GameGalaxy({ gameId }: { gameId: ID }) {
  const [color] = useState(Math.floor(Math.random() * COLORS.length));
  const [hovering, setHovering] = useState(false);
  return (
    <div
      className="flex flex-row gap-2 items-center"
      style={{ transform: "translate(-50%, -50%)" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Galaxy
        className="w-20 h-20 text-white hover:w-24 hover:h-24 duration-200 ease-in-out cursor-pointer"
        fill={COLORS[color]}
      />
      <motion.div
        className="primary-panel-solid p-2 flex flex-col gap-1"
        animate={{
          opacity: hovering ? 1 : 0,
          scale: hovering ? 1 : 0,
        }}
      >
        <h1>{gameId}</h1>
      </motion.div>
    </div>
  );
}

function GameItem({ game }: { game: Game }) {
  return <div className="flex flex-row gap-2 items-center">{game.name}</div>;
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
            <GameItem key={game.id} game={game} />
            {i < games.length - 1 && <hr className="opacity-10" />}
          </>
        ))}
      </div>
    </div>
  );
}
