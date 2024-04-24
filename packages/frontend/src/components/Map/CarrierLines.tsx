import { mapState, useZoom } from "@/lib/map";
import { Scan, getETA } from "@/lib/scan";
import { Line, Text } from "react-konva";

export function CarrierLines({
  scan,
  carrierId,
}: {
  scan: Scan | null;
  carrierId: ID;
}) {
  const carrier = scan?.carriers.find((c) => c.id === carrierId);
  if (!carrier) return null;

  return carrier.destination_queue.map((destinationId, i) => {
    const destination = scan?.stars.find((s) => s.id === destinationId);
    if (!destination) return null;

    const owner = scan?.players.find((p) => p.id === carrier.owner);
    if (!owner) return null;

    const previousDestination =
      i === 0
        ? carrier
        : scan?.stars.find((s) => s.id === carrier.destination_queue[i - 1]);
    if (!previousDestination) return null;

    return (
      <CarrierLine
        key={keys(carrierId, destinationId, i)}
        from={previousDestination}
        to={destination}
        color={owner.color}
        active={i === 0}
        carrierId={carrierId}
      />
    );
  });
}

function CarrierLine({
  from,
  to,
  color,
  active,
  carrierId,
}: {
  from: { position: { x: number; y: number } };
  to: { position: { x: number; y: number } };
  color?: string;
  active: boolean;
  carrierId: ID;
}) {
  const zoom = useZoom();
  const [offset, setOffset] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [selected, addSelected] = mapState((s) => [s.selected, s.addSelected]);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setOffset((offset: number) => (offset - 0.0005) % 1);
    }, 10);

    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (!to) return;

    const interval = setInterval(() => {
      setEta(getETA(from.position, to.position));
    }, 1000);

    return () => clearInterval(interval);
  }, [from, to]);

  if (zoom < 10) return null;

  // get slope of line
  const m =
    (to.position.y - from.position.y) / (to.position.x - from.position.x);
  // get angle of line
  const angle = Math.atan(m) * (180 / Math.PI);

  const isSelected = selected.some(
    (e) => e.type === "carrier" && e.id === carrierId
  );

  return (
    <>
      <Line
        points={[
          from.position.x,
          from.position.y,
          to.position.x,
          to.position.y,
        ]}
        stroke={"white"}
        opacity={isSelected ? 0.5 : 0.05}
        strokeWidth={10 / zoom}
        onClick={() => {
          addSelected({
            type: "carrier",
            id: carrierId,
          });
        }}
        key={keys(carrierId, "backline")}
      />
      <Line
        points={[
          from.position.x,
          from.position.y,
          to.position.x,
          to.position.y,
        ]}
        stroke={color ?? "white"}
        strokeWidth={2 / zoom}
        dash={[10 / zoom, 5 / zoom]}
        opacity={active ? 1 : 0.5}
        dashOffset={offset}
        listening={false}
        key={keys(carrierId, "line")}
      />
      <Text
        x={(from.position.x + to.position.x) / 2}
        y={(from.position.y + to.position.y) / 2}
        text={eta ? `${eta.toFixed(1)}h` : ""}
        fontSize={15 / zoom}
        fill={"white"}
        opacity={active ? 1 : 0.5}
        width={100 / zoom}
        align="center"
        offsetX={50 / zoom}
        offsetY={-10 / zoom}
        rotation={angle}
        visible={zoom > 50}
        listening={false}
        key={keys(carrierId, "eta")}
      />
    </>
  );
}
