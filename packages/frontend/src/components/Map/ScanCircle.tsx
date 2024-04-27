import { darken } from "@/lib/color";
import { useZoom } from "@/lib/map";
import { getScanningDistance } from "@/lib/players";
import { Scan, scanStore, usePlayer } from "@/lib/scan";
import { Circle } from "react-konva";

export function InnerScanCircle({ starId }: { starId: ID }) {
  const player = usePlayer();
  const scan = scanStore((s) => s.scan);
  const star = scan?.stars.find((s) => s.id === starId);

  if (!star || player?.id !== star?.occupier) {
    return null;
  }

  return (
    <Circle
      x={star.position.x}
      y={star.position.y}
      radius={getScanningDistance(player)}
      opacity={1}
      fill={"#192436"}
      // strokeWidth={1 / zoom}
      // dash={[10 / zoom, 5 / zoom]}
      listening={false}
    />
  );
}

export function OuterScanCircle({
  starId,
  zoom,
}: {
  starId: ID;
  zoom: number;
}) {
  const player = usePlayer();
  const scan = scanStore((s) => s.scan);
  const star = scan?.stars.find((s) => s.id === starId);

  if (!star || player?.id !== star?.occupier) {
    return null;
  }

  return (
    <Circle
      x={star.position.x}
      y={star.position.y}
      radius={getScanningDistance(player)}
      opacity={1}
      stroke={player.color}
      strokeWidth={2 / zoom}
      dash={[10 / zoom, 5 / zoom]}
      listening={false}
      globalCompositeOperation="source-over"
    />
  );
}
