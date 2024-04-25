/* eslint-disable jsx-a11y/alt-text */
import { darken, hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { mapState } from "@/lib/map";
import { Scan, getETA } from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image, Rect } from "react-konva";
import { Rocket } from "lucide-react";
import { useGame } from "@/lib/games";
import { Tooltip } from "../Theme/Tooltip";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function degToRad(angle: number) {
  return (angle / 180) * Math.PI;
}

function getCenter(shape: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}) {
  const angleRad = degToRad(shape.rotation || 0);
  return {
    x:
      shape.x +
      (shape.width / 2) * Math.cos(angleRad) +
      (shape.height / 2) * Math.sin(-angleRad),
    y:
      shape.y +
      (shape.height / 2) * Math.cos(angleRad) +
      (shape.width / 2) * Math.sin(angleRad),
  };
}

function rotateAroundPoint(
  shape: { x: number; y: number; rotation: number },
  deltaDeg: number,
  point: { x: number; y: number }
) {
  const angleRad = degToRad(deltaDeg);
  const x = Math.round(
    point.x +
      (shape.x - point.x) * Math.cos(angleRad) -
      (shape.y - point.y) * Math.sin(angleRad)
  );
  const y = Math.round(
    point.y +
      (shape.x - point.x) * Math.sin(angleRad) +
      (shape.y - point.y) * Math.cos(angleRad)
  );
  return {
    ...shape,
    rotation: Math.round(shape.rotation + deltaDeg),
    x,
    y,
  };
}

function rotateAroundCenter(
  shape: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  deltaDeg: number
) {
  const center = getCenter(shape);
  return rotateAroundPoint(shape, deltaDeg, center);
}

function CarrierName({
  from,
  to,
  color,
  ships,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number } | null;
  color: string | null;
  ships: number | null;
}) {
  const ref = React.useRef(null);
  if (!color) {
    color = "#888888";
  }

  return (
    <div className="flex flex-col items-center justify-center w-0 h-0">
      {exists(ships) && (
        <p
          className="px-2 w-fit text-[14px] font-mono flex items-center gap-1 mt-20"
          ref={ref}
        >
          <Rocket size={12} fill={color} stroke={color} />
          {ships}
        </p>
      )}
    </div>
  );
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
      listening={false}
    />
  ));

  return arcs;
}

export function MapCarrier({
  scan,
  carrierId,
}: {
  scan: Scan;
  carrierId: string;
}) {
  const img = useImage("/carrier.png");
  const carrier = scan.carriers.find((c) => c.id === carrierId);
  const owner = scan.players.find((p) => p.id === carrier?.owner);
  const [hovered, setHovered] = useState(false);
  const [zoom, selectedEntities] = mapState((s) => [s.zoom, s.selected]);
  const isSelected = selectedEntities.some(
    (e) => e.type === "carrier" && e.id === carrierId
  );

  const carrierSize = Math.max(Math.min(1, lerp(30, 80, 0 / 50) / zoom), 0.1);

  const color = owner?.color || null;

  if (!carrier) {
    return null;
  }

  const currentDestination = scan.stars.find(
    (s) => s.id === carrier.destination_queue[0]?.star
  );

  let rotation = 0;

  if (currentDestination) {
    //  get the degrees between the carrier and the destination
    const dx = currentDestination.position.x - carrier.position.x;
    const dy = currentDestination.position.y - carrier.position.y;
    rotation = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  }

  return (
    <>
      {img ? (
        <>
          <Image
            image={img}
            x={carrier.position.x}
            y={carrier.position.y}
            width={carrierSize}
            height={carrierSize}
            offsetX={carrierSize / 2}
            offsetY={carrierSize / 2}
            rotation={rotation}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            listening={false}
          />
        </>
      ) : (
        <Rect
          x={carrier.position.x}
          y={carrier.position.y}
          width={carrierSize}
          height={carrierSize}
          rotation={rotation}
          offsetX={carrierSize / 2}
          offsetY={carrierSize / 2}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          fill={owner?.color || "gray"}
          listening={false}
        />
      )}

      {(hovered || isSelected || zoom > 50) &&
        carrier.destination_queue.length > 0 && (
          <Html
            groupProps={{
              x: carrier.position.x,
              y: carrier.position.y,
              scale: { x: 1 / zoom, y: 1 / zoom },
              listening: false,
            }}
            divProps={{
              style: {
                pointerEvents: "none",
                zIndex: isSelected || hovered ? 100 : 0,
              },
            }}
          >
            <CarrierName
              color={color}
              ships={carrier.ships ?? null}
              from={carrier.position}
              to={currentDestination?.position ?? null}
            />
          </Html>
        )}

      {isSelected && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <Arc
              key={i}
              x={carrier.position.x}
              y={carrier.position.y}
              innerRadius={30 / zoom}
              outerRadius={30 / zoom / 1.1}
              angle={30}
              rotation={i * 90 + 30}
              fill="white"
              opacity={1}
              listening={false}
            />
          ))}
        </>
      )}
    </>
  );
}
