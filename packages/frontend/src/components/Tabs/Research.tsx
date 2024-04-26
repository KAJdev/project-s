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
      "The ability to scan stars and carriers for resources and ships.",
    formula: "scanning + 2 LY",
    affects: ["Stars", "Carriers"],
    icon: <Radar size={26} />,
  },
  {
    id: "hyperspace",
    name: "Hyperspace Range",
    description: "The ability to travel between stars.",
    formula: "hyperspace + 3 LY",
    affects: ["Carriers"],
    icon: <Rocket size={26} />,
  },
  {
    id: "terraforming",
    name: "Terraforming",
    description: "The ability to terraform stars for increased resources.",
    formula: "resources + (terraforming * 5)",
    affects: ["Stars"],
    icon: <Sprout size={26} />,
  },
  {
    id: "experimentation",
    name: "Experimentation",
    description: "Affects how big breakthroughs are.",
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
    description: "Additional cash earned each production cycle.",
    formula: "banking * 75",
    affects: ["Cash"],
    icon: <DollarSign size={26} />,
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description:
      "Increases the amount of ships stars produced each production cycle.",
    formula: "industry * (manufacturing + 5)",
    affects: ["Stars"],
    icon: <Building size={26} />,
  },
] as const;

function ResearchItem({
  technology,
  player,
  game,
}: {
  technology: (typeof TECHNOLOGIES)[number];
  player: Player;
  game: Game;
}) {
  const points = player.research_points?.[technology.id] ?? 0;
  const currentLevel = player.research_levels?.[technology.id] ?? 0;
  const cost = game.settings[`${technology.id}_cost`];
  const progress = points / cost;
  const [loading, setLoading] = useState(false);

  const isResearching = player.research_queue?.[0] === technology.id;

  return (
    <div
      className={classes(
        "bg-white/10 px-3 py-2 flex relative gap-4 border border-dotted items-center h-[5rem] z-0"
      )}
      style={{
        borderColor: isResearching ? player.color : "transparent",
      }}
    >
      <div
        className={classes("absolute left-0 top-0 h-full opacity-10 z-0")}
        style={{
          width: `${clamp(0, progress * 100, 100)}%`,
          backgroundColor: isResearching ? player.color : "white",
        }}
      />
      <div className="shrink-0 z-10">{technology.icon}</div>
      <div className="flex flex-col gap-1 h-full items-start z-10">
        <div className="text-lg flex gap-3 items-center">
          <span className="bg-[#315796] text-sm p-0.5 px-2">
            LVL {currentLevel}
          </span>
          {technology.name}
        </div>
        <p className="text-xs text-[10px] opacity-75">
          {technology.description}
        </p>
      </div>
      <div className="flex flex-col gap-1 items-center ml-auto w-[8rem] shrink-0 z-10">
        <p className="text-xs opacity-75">
          {points} / {cost}
        </p>
        <Button
          className={classes(
            "justify-center w-full",
            isResearching ? "p-0" : "p-2"
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
          {isResearching ? "Researching..." : "Set Active"}
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
  return (
    <div className="flex flex-col gap-2">
      {TECHNOLOGIES.map((technology) => (
        <ResearchItem
          key={technology.id}
          technology={technology}
          player={self}
          game={game}
        />
      ))}
    </div>
  );
}
