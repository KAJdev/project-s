import { darken } from "@/lib/color";
import { useZoom } from "@/lib/map";
import { getScanningDistance } from "@/lib/players";
import { Scan, scanStore, usePlayer, useScan } from "@/lib/scan";
import { Circle } from "react-konva";

export function InnerScanCircle({ planetId }: { planetId: ID }) {
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
  planetId,
  zoom,
}: {
  planetId: ID;
  zoom: number;
}) {
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
