/* eslint-disable jsx-a11y/alt-text */
import { darken, hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { mapState } from "@/lib/map";
import { Scan } from "@/lib/scan";
import Konva from "konva";
import { Arc, Circle, Image, Line, Rect, Text } from "react-konva";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function RotatingArcs({
  x,
  y,
  starSize,
  zoom,
  speed,
}: {
  x: number;
  y: number;
  starSize: number;
  zoom: number;
  speed: number;
}) {
  const [r, setR] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setR((r: number) => r + speed);
    }, 10);

    return () => clearInterval(interval);
  }, [speed]);

  const arcs = Array.from({ length: 4 }, (_, i) => (
    <Arc
      key={i}
      x={x}
      y={y}
      innerRadius={starSize / 1.55}
      outerRadius={starSize / 1.4}
      angle={30}
      rotation={i * 90 + 30 + r}
      fill="white"
      opacity={0.5}
    />
  ));

  return arcs;
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

  const starSize = Math.max(
    Math.min(2, lerp(30, 80, (star?.resources ?? 25) / 50) / zoom),
    0.2
  );

  const color = owner?.color || "#888";

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

      {(hovered || isSelected) && (
        <RotatingArcs
          x={star.position.x}
          y={star.position.y}
          starSize={starSize}
          zoom={zoom}
          speed={1}
        />
      )}
      <Rect
        x={star.position.x + starSize / 1.3}
        y={star.position.y - 11 / zoom}
        width={(star.name.length * 7 + 22) / zoom}
        height={20 / zoom}
        fill={color}
        opacity={0.5}
        visible={hovered || isSelected || zoom > 20}
      />
      <Text
        x={star.position.x + starSize / 1.1}
        y={star.position.y}
        width={500 / zoom}
        height={10 / zoom}
        text={star.name}
        fontFamily="monospace"
        fontSize={14 / zoom}
        fill="white"
        align="left"
        listening={false}
        lineHeight={0}
        visible={hovered || isSelected || zoom > 20}
      />

      {isSelected && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <Arc
              key={i}
              x={star.position.x}
              y={star.position.y}
              innerRadius={30 / zoom}
              outerRadius={30 / zoom / 1.1}
              angle={30}
              rotation={i * 90 + 30}
              fill="white"
              opacity={1}
            />
          ))}
        </>
      )}
    </>
  );
}
