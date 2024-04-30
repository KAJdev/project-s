/* eslint-disable jsx-a11y/alt-text */
import { useImage } from "@/lib/image";
import { SelectionObject, useFlightPlanningInfo } from "@/lib/map";
import {
  addToCarrierDestination,
  scanStore,
  useCarriersAround,
} from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image } from "react-konva";
import { DollarSign, Factory, Microscope, Rocket } from "lucide-react";
import { Tooltip } from "../Theme/Tooltip";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function stickyNumberFromUUID(uuid: string, max: number) {
  let sum = 0;
  for (let i = 0; i < uuid.length; i++) {
    sum += uuid.charCodeAt(i);
  }
  return sum % max;
}

export function useStarImagePath(starId: ID) {
  const starType = stickyNumberFromUUID(starId, 1);
  return `/star${starType}.png`;
}

export function useStarImage(starId: ID) {
  return useImage(useStarImagePath(starId));
}

function StarName({
  name,
  color,
  resources,
  ships,
}: {
  name: string | null;
  color: string | null;
  resources: {
    economy: number;
    industry: number;
    science: number;
  } | null;
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
      {name && (
        <p
          className="px-2"
          style={{
            borderColor: color,
          }}
          ref={ref}
        >
          {name}
        </p>
      )}
      {exists(ships) && (
        <p
          className="px-2 w-fit -mt-[2px] border-t-0 flex items-center gap-1"
          style={{
            borderColor: color,
          }}
          ref={ref}
        >
          <Rocket size={12} fill={color} stroke={color} />
          {ships}
        </p>
      )}

      {resources && (
        <div
          className="flex gap-4 px-2 relative select-none"
          style={{
            borderColor: color,
            fontSize: 12,
          }}
        >
          <Tooltip content="Economy" passThroughClassName="translate-y-4">
            <div className="flex items-center gap-1 pointer-events-auto">
              <DollarSign size={12} fill={color} stroke={color} />
              {resources.economy}
            </div>
          </Tooltip>
          <Tooltip content="Industry">
            <div className="flex items-center gap-1 pointer-events-auto">
              <Factory size={12} fill={color} stroke={color} />
              {resources.industry}
            </div>
          </Tooltip>

          <Tooltip content="Science" passThroughClassName="translate-y-4">
            <div className="flex items-center gap-1 pointer-events-auto">
              <Microscope size={12} fill={color} stroke={color} />
              {resources.science}
            </div>
          </Tooltip>
        </div>
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

export function MapStar({
  starId,
  zoom,
  selectedEntities,
  flightPlanningFor,
}: {
  starId: ID;
  zoom: number;
  selectedEntities: SelectionObject[];
  flightPlanningFor: ID | null;
}) {
  const scan = scanStore((state) => state.scan);
  const star = scan?.stars.find((s) => s.id === starId);
  const img = useStarImage(starId);
  const imgRef = React.useRef(null);
  const [hovered, setHovered] = useState(false);
  const carriers = useCarriersAround(star?.position, 0.1);
  const flightPlanInfo = useFlightPlanningInfo(starId);

  return useMemo(() => {
    if (!star) {
      return null;
    }

    const owner = scan?.players.find((p) => p.id === star?.occupier);
    const isSelected = selectedEntities.some(
      (e) => e.type === "star" && e.id === starId
    );

    const totalShips =
      (star?.ships ?? 0) +
      carriers
        .filter((c) => c.owner === star?.occupier)
        .reduce((acc, c) => acc + c.ships, 0);

    const starSize = Math.max(Math.min(0.5, lerp(30, 80, 0 / 50) / zoom), 0.1);

    const color = owner?.color || null;

    return (
      <>
        {zoom > 40 && img ? (
          <>
            <Image
              image={img}
              ref={imgRef}
              x={star.position.x - starSize / 2}
              y={star.position.y - starSize / 2}
              width={starSize}
              height={starSize}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              opacity={flightPlanInfo.outsideRange ? 0.2 : 1}
              listening={!flightPlanInfo.outsideRange}
              onMouseUp={(e) => {
                if (flightPlanningFor) {
                  addToCarrierDestination(starId);
                  e.cancelBubble = true;
                }
              }}
            />
            {color && (
              <>
                <Arc
                  x={star.position.x}
                  y={star.position.y}
                  innerRadius={starSize / 1.9}
                  outerRadius={starSize / 1.5}
                  angle={360}
                  fill={color}
                  opacity={0.75}
                  listening={false}
                  visible={!flightPlanInfo.outsideRange}
                />
                <Arc
                  x={star.position.x}
                  y={star.position.y}
                  innerRadius={starSize / 100}
                  outerRadius={starSize / 2.3}
                  angle={360}
                  fill={color}
                  opacity={0.3}
                  listening={false}
                  visible={!flightPlanInfo.outsideRange}
                />
              </>
            )}
          </>
        ) : (
          <Circle
            x={star.position.x}
            y={star.position.y}
            radius={starSize / 2}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            fill={owner?.color || "gray"}
            opacity={flightPlanInfo.outsideRange ? 0.2 : 1}
            listening={!flightPlanInfo.outsideRange}
            onMouseUp={(e) => {
              if (flightPlanningFor) {
                addToCarrierDestination(starId);
                e.cancelBubble = true;
              }
            }}
          />
        )}

        {(hovered || isSelected) && !flightPlanInfo.outsideRange && (
          <RotatingArcs
            x={star.position.x}
            y={star.position.y}
            starSize={starSize}
            zoom={zoom}
            speed={1}
          />
        )}

        {(hovered || isSelected || zoom > 50) && (
          <>
            <Html
              groupProps={{
                x: star.position.x,
                y: star.position.y + starSize / 1.1,
                scale: { x: 1 / zoom, y: 1 / zoom },
                listening: false,
              }}
              divProps={{
                style: {
                  pointerEvents: "none",
                  zIndex: isSelected || hovered ? 100 : 0,
                  opacity: flightPlanInfo.outsideRange ? 0.2 : 1,
                },
              }}
            >
              <StarName
                name={zoom > 175 ? star.name : null}
                color={color}
                ships={exists(star.ships) && star.occupier ? totalShips : null}
                resources={null}
              />
            </Html>
            {(hovered || isSelected || zoom > 175) && star.occupier && (
              <Html
                groupProps={{
                  x: star.position.x,
                  y: star.position.y - starSize / 0.7,
                  scale: { x: 1 / zoom, y: 1 / zoom },
                  listening: false,
                }}
                divProps={{
                  style: {
                    pointerEvents: "none",
                    zIndex: isSelected || hovered ? 100 : 0,
                    opacity: flightPlanInfo.outsideRange ? 0.2 : 1,
                  },
                }}
              >
                <StarName
                  name={null}
                  ships={null}
                  color={color}
                  resources={
                    star.resources && zoom > 75
                      ? {
                          economy: star.economy!,
                          industry: star.industry!,
                          science: star.science!,
                        }
                      : null
                  }
                />
              </Html>
            )}
          </>
        )}

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
                listening={false}
              />
            ))}
          </>
        )}
      </>
    );
  }, [
    carriers,
    flightPlanInfo.outsideRange,
    flightPlanningFor,
    hovered,
    img,
    scan?.players,
    selectedEntities,
    star,
    starId,
    zoom,
  ]);
}
