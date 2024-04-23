import { darken } from "@/lib/color";
import { getHyperSpaceDistance, getScanningDistance } from "@/lib/players";
import { Scan, usePlayer } from "@/lib/scan";
import { Circle } from "react-konva";

export function HyperspaceCircle({
  scan,
  starId,
  zoom,
}: {
  scan: Scan;
  starId: ID;
  zoom: number;
}) {
  const player = usePlayer();
  const star = scan.stars.find((s) => s.id === starId);

  if (!star || player?.id !== star?.occupier) {
    return null;
  }

  return (
    <Circle
      x={star.position.x}
      y={star.position.y}
      radius={getHyperSpaceDistance(player)}
      opacity={1}
      // fill={darken(player.color, -170)}
      fill="#192436"
      listening={false}
    />
  );
}
