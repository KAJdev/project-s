import { darken } from "@/lib/color";
import { mapState } from "@/lib/map";
import { getHyperSpaceDistance, getScanningDistance } from "@/lib/players";
import { Scan, usePlayer } from "@/lib/scan";
import { Circle } from "react-konva";

export function ScanCircle({ scan, starId }: { scan: Scan; starId: ID }) {
  const player = usePlayer();
  const star = scan.stars.find((s) => s.id === starId);
  const owner = scan.players.find((p) => p.id === star?.occupier);
  const zoom = mapState((s) => s.zoom);

  if (!star || player?.id !== star?.occupier) {
    return null;
  }

  return (
    <>
      <Circle
        x={star.position.x}
        y={star.position.y}
        radius={getHyperSpaceDistance(player)}
        opacity={1}
        fill={darken(player.color, -170)}
        listening={false}
        zIndex={0}
      />
      <Circle
        x={star.position.x}
        y={star.position.y}
        radius={getScanningDistance(player)}
        opacity={1}
        fill={darken(player.color, -150)}
        listening={false}
        zIndex={1000}
      />
    </>
  );
}
