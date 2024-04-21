import { mapState } from "@/lib/map";
import { Scan } from "@/lib/scan";
import { Circle, Text } from "react-konva";

export function MapStar({ scan, starId }: { scan: Scan; starId: ID }) {
  const star = scan.stars.find((s) => s.id === starId);
  const owner = scan.players.find((p) => p.id === star?.occupier);
  const [hovered, setHovered] = useState(false);
  const zoom = mapState((s) => s.zoom);

  if (!star) {
    return null;
  }

  return (
    <>
      <Circle
        x={star.position.x}
        y={star.position.y}
        radius={10 / zoom}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        fill={owner?.color || "gray"}
      />
      {star.resources && (
        <Circle
          x={star.position.x}
          y={star.position.y}
          radius={star.resources / zoom}
          stroke={"white"}
          strokeWidth={1 / zoom}
          opacity={0.2}
          fill={"transparent"}
        />
      )}
      {hovered && (
        <Text
          x={star.position.x - 50 / zoom}
          y={star.position.y + 2}
          width={100 / zoom}
          text={star.name}
          fontSize={14 / zoom}
          fill="white"
          align="center"
        />
      )}
    </>
  );
}
