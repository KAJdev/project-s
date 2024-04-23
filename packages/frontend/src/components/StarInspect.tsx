import {
  Player,
  Star,
  usePlayer,
  useSpecificPlayer,
  useStar,
  useStarCosts,
} from "@/lib/scan";
import { Field, Inspector } from "./Inspector";
import { Button } from "./Theme/Button";

export function StarAspect({
  star,
  starCosts,
  player,
  aspect,
  sublabel,
}: {
  star: Star;
  starCosts: {
    economy: number;
    industry: number;
    science: number;
    warp_gate: number;
  };
  player?: Player;
  aspect: "economy" | "industry" | "science";
  sublabel?: string;
}) {
  return (
    <Field variant="box" label={aspect} sublabel={sublabel}>
      <p className="w-full text-center text-2xl">{star[aspect]}</p>
      {player?.id === star.occupier && (
        <Button
          className="w-full justify-center mt-2 px-0 py-0"
          variant="vibrant"
          onClick={() => {
            console.log(`Upgrade ${aspect}`);
          }}
        >
          <p className="px-2 py-[0.4rem] w-full text-left">Upgrade </p>
          <p className="px-3 py-[0.4rem] shrink-0 bg-white/10">
            ${starCosts[aspect].toFixed(0)}
          </p>
        </Button>
      )}
    </Field>
  );
}

export function StarInspect({ starId }: { starId: ID }) {
  const star = useStar(starId);
  const player = usePlayer();
  const occupier = useSpecificPlayer(star?.occupier || "");
  const starCosts = useStarCosts(starId);
  if (!star)
    return <Inspector title="unknown" nothingMessage="No star found." />;

  return (
    <Inspector
      title={star.name}
      subtitle="Star"
      superTitle={star.id}
      nothingMessage="No star selected"
    >
      {exists(star.resources) && (
        <div className="flex">
          <StarAspect
            star={star}
            starCosts={starCosts}
            player={player}
            aspect="economy"
          />
          <StarAspect
            star={star}
            starCosts={starCosts}
            player={player}
            aspect="industry"
          />
          <StarAspect
            star={star}
            starCosts={starCosts}
            player={player}
            aspect="science"
          />
        </div>
      )}
      <Field label="Occupied By">
        <p
          style={{
            color: occupier ? occupier.color : "gray",
          }}
        >
          {occupier ? occupier.name : "NULL"}
        </p>
      </Field>
      <Field
        label="Resources"
        sublabel={
          exists(star.resources)
            ? "Higher resources make star upgrades cheaper"
            : undefined
        }
      >
        {exists(star.resources)
          ? `${star.resources}${
              player?.id === star.occupier
                ? ` + ${(player?.research_levels.terraforming ?? 1) * 5} = ${
                    star.resources! +
                    (player?.research_levels.terraforming ?? 1) * 5
                  }`
                : ""
            } (${((star.resources! / 50) * 100).toFixed(0)}%)`
          : "UNKNOWN"}
      </Field>
      {exists(star.ships) && <Field label="Ships">{star.ships}</Field>}
      <Field label="Coordinates">
        ({star.position.x.toFixed(4)} LY, {star.position.y.toFixed(4)} LY)
      </Field>
    </Inspector>
  );
}
