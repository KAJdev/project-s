import { getHyperSpaceDistance } from "@/lib/players";
import { Scan, scanStore, usePlayer, useScan } from "@/lib/scan";
import { Circle } from "react-konva";

export function HyperspaceCircle({ planetId }: { planetId: ID }) {
  const player = usePlayer();
  const scan = useScan();
  const planet = scan?.planets.find((p) => p.id === planetId);

  if (!planet || player?.id !== planet?.occupier) {
    return null;
  }

  return (
    <Circle
      x={planet.position.x}
      y={planet.position.y}
      radius={getHyperSpaceDistance(player)}
      opacity={1}
      // fill={darken(player.color, -170)}
      fill="#192436"
      listening={false}
    />
  );
}
