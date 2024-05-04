/* eslint-disable jsx-a11y/alt-text */
import { useImage } from "@/lib/image";
import { SelectionObject } from "@/lib/map";
import { useScan } from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image } from "react-konva";

function stickyNumberFromUUID(uuid: string, max: number) {
  let sum = 0;
  for (let i = 0; i < uuid.length; i++) {
    sum += uuid.charCodeAt(i);
  }
  return sum % max;
}

export function useStarImagePath(starId: ID) {
  const starType = stickyNumberFromUUID(starId, 2);
  return `/star${starType}.png`;
}

export function useStarImage(starId: ID) {
  return useImage(useStarImagePath(starId));
}

function StarName({ name }: { name: string | null }) {
  const ref = React.useRef(null);
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
            borderColor: "#888888",
          }}
          ref={ref}
        >
          {name}
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

function OrbitLine({
  position,
  radius,
  zoom,
}: {
  position: {
    x: number;
    y: number;
  };
  radius: number;
  zoom: number;
}) {
  const ref = useRef<any>(null);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!ref.current) {
  //       return;
  //     }
  //     const currentOffset = ref.current.dashOffset();
  //     ref.current.dashOffset((currentOffset - 0.0008) % 1);
  //   }, 10);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <Circle
      ref={ref}
      x={position.x}
      y={position.y}
      radius={radius}
      stroke={"white"}
      strokeWidth={1 / zoom}
      // dash={[10 / zoom, 5 / zoom]}
      listening={false}
      opacity={0.1}
    />
  );
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
  const scan = useScan();
  const star = scan?.stars.find((s) => s.id === starId);
  const img = useStarImage(starId);
  const imgRef = React.useRef(null);
  const [hovered, setHovered] = useState(false);
  const orbitingPlanets = scan?.planets.filter((p) => p.orbits === starId);

  return useMemo(() => {
    if (!star) {
      return null;
    }

    const isSelected = selectedEntities.some(
      (e) => e.type === "star" && e.id === starId
    );

    const starSize = Math.max(Math.min(1, 200 / zoom), 0.1);

    return (
      <>
        {orbitingPlanets?.map((planet) => (
          <OrbitLine
            key={planet.id}
            position={star.position}
            radius={planet.distance}
            zoom={zoom}
          />
        ))}

        {/* light bc why not */}
        <Circle
          x={star.position.x}
          y={star.position.y}
          radius={5}
          //  radial gradient fill
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={5}
          fillRadialGradientColorStops={[0, "white", 1, "rgba(255,255,255,0)"]}
          opacity={0.1}
          listening={false}
        />

        <Image
          image={img}
          ref={imgRef}
          x={star.position.x - starSize / 2}
          y={star.position.y - starSize / 2}
          width={starSize}
          height={starSize}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          opacity={flightPlanningFor ? 0.2 : 1}
          listening={false}
        />

        {(hovered || isSelected) && !flightPlanningFor && (
          <RotatingArcs
            x={star.position.x}
            y={star.position.y}
            starSize={starSize}
            zoom={zoom}
            speed={1}
          />
        )}

        {(hovered || isSelected || zoom > 50) && !flightPlanningFor && (
          <>
            <Html
              groupProps={{
                x: star.position.x,
                y: star.position.y + starSize / 1.8,
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
              <StarName name={star.name} />
            </Html>
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
    flightPlanningFor,
    hovered,
    img,
    orbitingPlanets,
    selectedEntities,
    star,
    starId,
    zoom,
  ]);
}
