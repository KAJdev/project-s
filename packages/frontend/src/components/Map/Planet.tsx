/* eslint-disable jsx-a11y/alt-text */
import { useImage } from "@/lib/image";
import { SelectionObject, useFlightPlanningInfo } from "@/lib/map";
import {
  addToCarrierDestination,
  scanStore,
  useCarriersAround,
  useScan,
} from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image } from "react-konva";
import { DollarSign, Factory, Microscope, Rocket } from "lucide-react";
import { Tooltip } from "../Theme/Tooltip";
import { KonvaEventObject } from "konva/lib/Node";
import { usePlanetImage } from "@/lib/planets";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function PlanetName({
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

export function MapPlanet({
  planetId,
  zoom,
  selectedEntities,
  flightPlanningFor,
}: {
  planetId: ID;
  zoom: number;
  selectedEntities: SelectionObject[];
  flightPlanningFor: ID | null;
}) {
  const scan = useScan();
  const planet = scan?.planets.find((p) => p.id === planetId);
  const [hovered, setHovered] = useState(false);
  const carriers = useCarriersAround(planet?.position, 0.1);
  const flightPlanInfo = useFlightPlanningInfo(planetId);
  const img = usePlanetImage(planetId);

  const onPressed = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (flightPlanningFor) {
        addToCarrierDestination(planetId);
        e.cancelBubble = true;
      }
    },
    [flightPlanningFor, planetId]
  );

  return useMemo(() => {
    if (!planet) {
      return null;
    }

    const owner = scan?.players.find((p) => p.id === planet?.occupier);
    const isSelected = selectedEntities.some(
      (e) => e.type === "planet" && e.id === planetId
    );

    const totalShips =
      (planet?.ships ?? 0) +
      carriers
        .filter((c) => c.owner === planet?.occupier)
        .reduce((acc, c) => acc + c.ships, 0);

    const starSize = Math.max(Math.min(0.5, lerp(30, 80, 0 / 50) / zoom), 0.1);

    const color = owner?.color || null;

    return (
      <>
        <>
          {img && zoom > 20 ? (
            <Image
              x={planet.position.x - starSize / 2}
              y={planet.position.y - starSize / 2}
              image={img}
              width={starSize}
              height={starSize}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              listening={!flightPlanInfo.outsideRange}
              onMouseUp={onPressed}
              onTouchEnd={onPressed}
            />
          ) : (
            <Circle
              x={planet.position.x}
              y={planet.position.y}
              radius={starSize / 2}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              fill={owner?.color || "gray"}
              opacity={flightPlanInfo.outsideRange ? 0.2 : 1}
              listening={!flightPlanInfo.outsideRange}
              onMouseUp={onPressed}
              onTouchEnd={onPressed}
            />
          )}
          {/* {color && zoom > 40 && (
            <>
              <Arc
                x={planet.position.x}
                y={planet.position.y}
                innerRadius={starSize / 1.9}
                outerRadius={starSize / 1.5}
                angle={360}
                fill={color}
                opacity={0.75}
                listening={false}
                visible={!flightPlanInfo.outsideRange}
              />
              <Arc
                x={planet.position.x}
                y={planet.position.y}
                innerRadius={starSize / 100}
                outerRadius={starSize / 2.3}
                angle={360}
                fill={color}
                opacity={0.3}
                listening={false}
                visible={!flightPlanInfo.outsideRange}
              />
            </>
          )} */}
        </>

        {(hovered || isSelected) && !flightPlanInfo.outsideRange && (
          <RotatingArcs
            x={planet.position.x}
            y={planet.position.y}
            starSize={starSize}
            zoom={zoom}
            speed={1}
          />
        )}

        {(hovered || isSelected || zoom > 50) && (
          <>
            <Html
              groupProps={{
                x: planet.position.x,
                y: planet.position.y + starSize / 1.1,
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
              <PlanetName
                name={zoom > 175 ? planet.name : null}
                color={color}
                ships={
                  exists(planet.ships) && planet.occupier ? totalShips : null
                }
                resources={null}
              />
            </Html>
            {(hovered || isSelected || zoom > 175) && planet.occupier && (
              <Html
                groupProps={{
                  x: planet.position.x,
                  y: planet.position.y - starSize / 0.7,
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
                <PlanetName
                  name={null}
                  ships={null}
                  color={color}
                  resources={
                    planet.resources && zoom > 75
                      ? {
                          economy: planet.economy!,
                          industry: planet.industry!,
                          science: planet.science!,
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
                x={planet.position.x}
                y={planet.position.y}
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
    planet,
    scan?.players,
    selectedEntities,
    carriers,
    zoom,
    flightPlanInfo.outsideRange,
    onPressed,
    hovered,
    planetId,
  ]);
}
