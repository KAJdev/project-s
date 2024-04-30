import { Player, scanStore, usePlayer } from "@/lib/scan";
import {
  DollarSign,
  Microscope,
  Radar,
  Rocket,
  Sprout,
  Swords,
  Building,
} from "lucide-react";
import { Button } from "../Theme/Button";
import { Game, useGame } from "@/lib/games";
import { switchActiveResearch } from "@/lib/players";

const TECHNOLOGIES = [
  {
    id: "scanning",
    name: "Scanning",
    description:
      "Increases the scanning radius of stars and carriers around stars by 1 LY per level.",
    formula: "scanning + 2 LY",
    affects: ["Stars", "Carriers"],
    icon: <Radar size={26} />,
  },
  {
    id: "hyperspace",
    name: "Hyperspace Range",
    description:
      "Increases the maximum carrier travel distance between stars by 1 LY per level.",
    formula: "hyperspace + 3 LY",
    affects: ["Carriers"],
    icon: <Rocket size={26} />,
  },
  {
    id: "terraforming",
    name: "Terraforming",
    description: "Increases the base resources of a star by 5 per level.",
    formula: "resources + (terraforming * 5)",
    affects: ["Stars"],
    icon: <Sprout size={26} />,
  },
  {
    id: "experimentation",
    name: "Experimentation",
    description: "Increases the points in breakthroughs by 72 per level.",
    formula: "experimentation * 72",
    affects: ["Research"],
    icon: <Microscope size={26} />,
  },
  {
    id: "weapons",
    name: "Weapons",
    description: "How many ships you can destroy at a time in combat rounds.",
    formula: "weapons",
    affects: ["Combat"],
    icon: <Swords size={26} />,
  },
  {
    id: "banking",
    name: "Banking",
    description:
      "Increases the amount of cash produced each production cycle by $75 per level.",
    formula: "banking * 75",
    affects: ["Cash"],
    icon: <DollarSign size={26} />,
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description:
      "Increases ships stars produce each production cycle by 5 per industry per level.",
    formula: "industry * (manufacturing + 5)",
    affects: ["Stars"],
    icon: <Building size={26} />,
  },
] as const;

function ResearchItem({
  technology,
  player,
  game,
  playerScience,
}: {
  technology: (typeof TECHNOLOGIES)[number];
  player: Player;
  game: Game;
  playerScience: number;
}) {
  const points = player.research_points?.[technology.id] ?? 0;
  const currentLevel = player.research_levels?.[technology.id] ?? 0;
  const cost = game.settings[`${technology.id}_cost`] * currentLevel;
  const progress = points / cost;
  const [loading, setLoading] = useState(false);

  const isResearching = player.research_queue?.[0] === technology.id;

  const eta = Math.ceil((cost - points) / playerScience);

  return (
    <div
      className={classes(
        "bg-white/10 px-3 py-2 flex sm:flex-row flex-col relative gap-4 border border-dotted items-center min-h-[5.7rem] z-0"
      )}
      style={{
        borderColor: isResearching ? player.color : "transparent",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className={classes("absolute left-0 top-0 h-full opacity-10 z-0")}
          style={{
            width: `${clamp(0, progress * 100, 100)}%`,
            backgroundColor: isResearching ? player.color : "white",
          }}
        />
        <div className="shrink-0 z-10">{technology.icon}</div>
        <div className="flex flex-col gap-0.5 h-full items-start z-10">
          <div className="text-lg flex gap-2 items-center">
            <span className="bg-[#315796] text-sm p-[1px] px-2 shrink-0">
              LVL {currentLevel}
            </span>
            {technology.name}
          </div>
          <p className="text-xs text-[9px] sm:text-[11px] opacity-75">
            {technology.description}
          </p>
        </div>
      </div>
      <div className="flex sm:flex-col gap-2 items-center ml-auto w-full justify-between sm:w-[8rem] shrink-0 z-10">
        <p className="text-sm opacity-75">
          {points} / {cost}
        </p>
        <Button
          className={classes(
            "justify-center sm:w-full",
            isResearching ? "p-0" : "sm:p-2 text-xs"
          )}
          variant={isResearching ? "transparent" : "outline"}
          disabled={isResearching}
          loading={loading}
          onClick={() => {
            setLoading(true);
            switchActiveResearch(technology.id).finally(() =>
              setLoading(false)
            );
          }}
        >
          {isResearching
            ? `ETA: ${eta} hour${eta > 1 ? "s" : ""}`
            : "Set Active"}
        </Button>
      </div>
    </div>
  );
}

export function Research() {
  const self = usePlayer();
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);
  if (!self) return null;

  const playerScience =
    scan?.stars
      .filter((s) => s.occupier === self.id)
      .reduce((acc, s) => acc + (s.science ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-2 p-4">
      {TECHNOLOGIES.map((technology) => (
        <ResearchItem
          key={technology.id}
          technology={technology}
          player={self}
          game={game}
          playerScience={playerScience}
        />
      ))}
    </div>
  );
}
