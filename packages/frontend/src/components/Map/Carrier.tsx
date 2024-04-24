/* eslint-disable jsx-a11y/alt-text */
import { darken, hexToHSV, hexToRgb } from "@/lib/color";
import { useImage } from "@/lib/image";
import { mapState } from "@/lib/map";
import { Scan } from "@/lib/scan";
import { Html } from "react-konva-utils";
import { Arc, Circle, Image } from "react-konva";
import { Rocket } from "lucide-react";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function CarrierName({
  name,
  color,
  ships,
}: {
  name: string;
  color: string | null;
  ships: number | null;
}) {
  const ref = React.useRef(null);
  if (!color) {
    color = "#888888";
  }
  return (
    <div
      className="flex flex-col"
      style={{
        transform: "translateY(-50%)",
        fontFamily: "monospace",
        fontSize: 14,
      }}
    >
      <p
        className="px-2 border"
        style={{
          backgroundColor: darken(color, -200),
          borderColor: color,
        }}
        ref={ref}
      >
        {name}
      </p>
      {exists(ships) && (
        <p
          className="px-2 w-fit -mt-[2px] border border-t-0 flex items-center gap-1"
          style={{
            backgroundColor: darken(color, -200),
            borderColor: color,
          }}
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

  return (
    <>
      {zoom > 10 && img ? (
        <>
          <Image
            image={img}
            x={carrier.position.x - carrierSize / 2}
            y={carrier.position.y - carrierSize / 2}
            width={carrierSize}
            height={carrierSize}
            opacity={selectedEntities.length > 0 && !isSelected ? 0.5 : 1}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            listening={false}
          />
          {color && (
            <Arc
              x={carrier.position.x}
              y={carrier.position.y}
              innerRadius={carrierSize / 2}
              outerRadius={carrierSize / 1.6}
              angle={360}
              fill={color}
              opacity={0.5}
              listening={false}
            />
          )}
        </>
      ) : (
        <Circle
          x={carrier.position.x}
          y={carrier.position.y}
          radius={carrierSize / 2}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          fill={owner?.color || "gray"}
          opacity={selectedEntities.length > 0 && !isSelected ? 0.5 : 1}
          listening={false}
        />
      )}

      {(hovered || isSelected) && carrier.destination_queue.length > 0 && (
        <RotatingArcs
          x={carrier.position.x}
          y={carrier.position.y}
          starSize={carrierSize}
          zoom={zoom}
          speed={1}
        />
      )}

      {(hovered || isSelected || zoom > 20) &&
        carrier.destination_queue.length > 0 && (
          <Html
            groupProps={{
              x: carrier.position.x + carrierSize / 1.1,
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
              name={carrier.name}
              color={color}
              ships={carrier.ships ?? null}
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
