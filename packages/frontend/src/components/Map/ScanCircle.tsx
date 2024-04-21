import { darken } from "@/lib/color";
import { mapState } from "@/lib/map";
import { getScanningDistance } from "@/lib/players";
import { Scan, usePlayer } from "@/lib/scan";
import { Circle } from "react-konva";

export function ScanCircle({ scan, starId }: { scan: Scan; starId: ID }) {
  const player = usePlayer();
  const star = scan.stars.find((s) => s.id === starId);
  const owner = scan.players.find((p) => p.id === star?.occupier);
  const zoom = mapState((s) => s.zoom);

  if (!star) {
    return null;
  }

  return (
    <>
      {player?.id === star.occupier && (
        <Circle
          x={star.position.x}
          y={star.position.y}
          radius={getScanningDistance(player) / (1 / zoom)}
          opacity={1}
          fill={darken(player.color, 0.5)}
        />
      )}
    </>
  );
}
