/* eslint-disable jsx-a11y/alt-text */
import { darken, hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { SelectionObject, mapState, useZoom } from "@/lib/map";
import { Carrier, Scan, getETA, scanStore } from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image, Rect } from "react-konva";
import { Rocket } from "lucide-react";
import { useGame } from "@/lib/games";
import { Tooltip } from "../Theme/Tooltip";
import { distance } from "@/lib/utils";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function positionLerp(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number
) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
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
    <div
      className="flex flex-col items-center"
      style={{
        transform: "translateX(-50%)",
        fontFamily: "monospace",
        fontSize: 14,
      }}
    >
      {exists(ships) && (
        <p className="gap-1 flex items-center" ref={ref}>
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
  carrierId,
  selectedEntities,
  zoom,
}: {
  carrierId: string;
  selectedEntities: SelectionObject[];
  zoom: number;
}) {
  const img = useImage("/carrier.png");
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);
  const carrier = scan?.carriers.find((c) => c.id === carrierId);
  const owner = scan?.players.find((p) => p.id === carrier?.owner);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedEntities.some(
    (e) => e.type === "carrier" && e.id === carrierId
  );

  const [localPosition, setLocalPosition] = useState<
    Carrier["position"] | null
  >(
    carrier?.position ?? {
      x: 0,
      y: 0,
    }
  );
  const [lastUpdated, setLastUpdated] = useState(
    Date.now() - (Date.now() % 60000)
  );

  const carrierSize = Math.max(Math.min(1, lerp(30, 80, 0 / 50) / zoom), 0.1);
  const color = owner?.color || null;

  const currentDestination = scan?.stars.find(
    (s) => s.id === carrier?.destination_queue[0]?.star
  );

  useEffect(() => {
    setLocalPosition(carrier?.position);
    setLastUpdated(Date.now() - (Date.now() % 60000));

    if (!carrier || !currentDestination) {
      return;
    }

    const distance_to_move = distance(
      carrier.position,
      currentDestination.position
    );

    const direction = {
      x:
        (currentDestination.position.x - carrier.position.x) / distance_to_move,
      y:
        (currentDestination.position.y - carrier.position.y) / distance_to_move,
    };

    const targetPositionNextTick =
      distance_to_move <= game.settings.carrier_speed / 60
        ? currentDestination.position
        : {
            x:
              carrier.position.x +
              (direction.x * game.settings.carrier_speed) / 60,
            y:
              carrier.position.y +
              (direction.y * game.settings.carrier_speed) / 60,
          };

    // start a loop to Lerp the position of the carrier towards the destination
    // const interval = setInterval(() => {
    //   // ticks are 60 seconds apart
    //   const t = (Date.now() - lastUpdated) / 60000;
    //   const newPosition = positionLerp(
    //     carrier.position,
    //     targetPositionNextTick,
    //     t
    //   );
    //   setLocalPosition(newPosition);
    // }, 200);

    // return () => clearInterval(interval);
  }, [
    carrier,
    carrier?.position,
    currentDestination,
    game.settings.carrier_speed,
    lastUpdated,
  ]);

  if (!carrier) {
    return null;
  }

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
            x={localPosition.x}
            y={localPosition.y}
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
          x={localPosition.x}
          y={localPosition.y}
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
              x: localPosition.x,
              y: localPosition.y + carrierSize / 1.1,
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
              from={localPosition}
              to={currentDestination?.position ?? null}
            />
          </Html>
        )}

      {isSelected && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <Arc
              key={i}
              x={localPosition.x}
              y={localPosition.y}
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
