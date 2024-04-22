/* eslint-disable jsx-a11y/alt-text */
import { hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { mapState } from "@/lib/map";
import { Scan } from "@/lib/scan";
import Konva from "konva";
import { Arc, Circle, Image, Line, Text } from "react-konva";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function MapStar({ scan, starId }: { scan: Scan; starId: ID }) {
  const img = useImage("/star.png");
  const imgRef = React.useRef(null);
  const star = scan.stars.find((s) => s.id === starId);
  const owner = scan.players.find((p) => p.id === star?.occupier);
  const [hovered, setHovered] = useState(false);
  const zoom = mapState((s) => s.zoom);
  const selectedEntity = mapState((s) => s.selected);
  const isSelected =
    selectedEntity?.type === "star" && selectedEntity.id === starId;

  const starSize = Math.min(
    2,
    lerp(10, 40, (star?.resources ?? 25) / 50) / zoom
  );

  const color = owner?.color || "#080808";

  if (!star) {
    return null;
  }

  return (
    <>
      {zoom > 10 && img ? (
        <>
          <Image
            image={img}
            ref={imgRef}
            x={star.position.x - starSize / 2}
            y={star.position.y - starSize / 2}
            width={starSize}
            height={starSize}
            opacity={selectedEntity && !isSelected ? 0.5 : 1}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
              mapState.getState().setSelected({ type: "star", id: star.id });
            }}
          />
          <Arc
            x={star.position.x}
            y={star.position.y}
            innerRadius={starSize / 2}
            outerRadius={starSize / 1.6}
            angle={360}
            fill={color}
            opacity={0.5}
            listening={false}
          />
        </>
      ) : (
        <Circle
          x={star.position.x}
          y={star.position.y}
          radius={starSize / 2}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          fill={owner?.color || "gray"}
          opacity={selectedEntity && !isSelected ? 0.5 : 1}
          onClick={() => {
            mapState.getState().setSelected({ type: "star", id: star.id });
          }}
        />
      )}
      <Text
        x={star.position.x - 50 / zoom}
        y={star.position.y - 30 / zoom}
        width={100 / zoom}
        text={`${star.economy} ${star.industry} ${star.science}`}
        fontSize={14 / zoom}
        fill="white"
        align="center"
        listening={false}
        visible={
          (hovered || isSelected) &&
          star.science !== undefined &&
          star.industry !== undefined &&
          star.economy !== undefined
        }
      />
      <Text
        x={star.position.x - 250 / zoom}
        y={star.position.y + 20 / zoom}
        width={500 / zoom}
        text={star.name}
        fontSize={14 / zoom}
        fill="white"
        align="center"
        listening={false}
        visible={hovered || isSelected}
      />
      <Text
        x={star.position.x - 50 / zoom}
        y={star.position.y + 40 / zoom}
        width={100 / zoom}
        text={`${star.ships} Ships`}
        fontSize={10 / zoom}
        fill="white"
        align="center"
        listening={false}
        visible={star.ships !== undefined && (hovered || isSelected)}
      />

      {isSelected && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <Arc
              key={i}
              x={star.position.x}
              y={star.position.y}
              innerRadius={30 / zoom / 0.3}
              outerRadius={30 / zoom / 0.29}
              angle={30}
              rotation={i * 90 + 30}
              fill="white"
              opacity={0.5}
            />
          ))}
        </>
      )}
    </>
  );
}
