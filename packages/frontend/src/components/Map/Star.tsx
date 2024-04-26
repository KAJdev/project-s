/* eslint-disable jsx-a11y/alt-text */
import { darken, hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { mapState, useFlightPlanningInfo } from "@/lib/map";
import { Scan, addToCarrierDestination, useCarriersAround } from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image } from "react-konva";
import { Rocket } from "lucide-react";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function pointWithinRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function starInViewport(
  star: { position: { x: number; y: number } },
  viewport: {
    x: number;
    y: number;
    zoom: number;
    width: number;
    height: number;
  }
) {
  const { x, y } = star.position;
  const { zoom, width, height } = viewport;

  return pointWithinRect(x, y, {
    x: viewport.x,
    y: viewport.y,
    width: width / zoom,
    height: height / zoom,
  });
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
            //backgroundColor: darken(color, -200),
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
            //backgroundColor: darken(color, -200),
            borderColor: color,
          }}
          ref={ref}
        >
          <Rocket size={12} fill={color} stroke={color} />
          {ships}
        </p>
      )}

      {/* {resources && false && (
        <div
          className="flex gap-5 px-2"
          style={{
            borderColor: color,
            fontSize: 12,
          }}
        >
          <p>{resources.economy}</p>
          <p>{resources.industry}</p>
          <p>{resources.science}</p>
        </div>
      )} */}
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

export function MapStar({ scan, starId }: { scan: Scan; starId: ID }) {
  const img = useImage("/star.png");
  const imgRef = React.useRef(null);
  const star = scan.stars.find((s) => s.id === starId);
  const owner = scan.players.find((p) => p.id === star?.occupier);
  const [hovered, setHovered] = useState(false);
  const [zoom, selectedEntities, flightPlanningFor] = mapState((s) => [
    s.zoom,
    s.selected,
    s.flightPlanningFor,
  ]);
  const isSelected = selectedEntities.some(
    (e) => e.type === "star" && e.id === starId
  );

  const carriers = useCarriersAround(star?.position, 0.1);
  const flightPlanInfo = useFlightPlanningInfo(starId);
  const totalShips =
    (star?.ships ?? 0) +
    carriers
      .filter((c) => c.owner === star?.occupier)
      .reduce((acc, c) => acc + c.ships, 0);

  const starSize = Math.max(Math.min(0.5, lerp(30, 80, 0 / 50) / zoom), 0.1);

  const color = owner?.color || null;

  if (!star) {
    return null;
  }

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
            <Arc
              x={star.position.x}
              y={star.position.y}
              innerRadius={starSize / 2}
              outerRadius={starSize / 1.6}
              angle={360}
              fill={color}
              opacity={0.5}
              listening={false}
              visible={!flightPlanInfo.outsideRange}
            />
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
            ships={exists(star.ships) ? totalShips : null}
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
}
