import {
  Carrier,
  Star,
  usePlayers,
  useSpecificPlayer,
  useStars,
} from "@/lib/scan";
import { Field } from "./Inspector";
import { Plus } from "lucide-react";
import { Tooltip } from "./Theme/Tooltip";
import { mapState } from "@/lib/map";

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function GraphStar({ star }: { star: Star }) {
  const player = useSpecificPlayer(star.occupier);
  return (
    <Tooltip content={star.name}>
      <div
        className="w-8 h-8 rounded-full"
        style={{ backgroundColor: player?.color ?? "#888888" }}
      />
    </Tooltip>
  );
}

export function DestinationGraph({ carrier }: { carrier: Carrier }) {
  const stars = useStars(carrier.destination_queue);
  const [flightPlanningFor, setFlightPlanningFor] = mapState((s) => [
    s.flightPlanningFor,
    s.setFlightPlanningFor,
  ]);

  return (
    <Field label="Flight Plan" variant="box">
      <div className="flex my-5 justify-center items-center">
        {stars.map((star, i) => (
          <>
            <GraphStar key={star.id} star={star} />
            <div className="w-8 border border-dashed border-white/10" />
          </>
        ))}
        {flightPlanningFor === carrier.id ? (
          <h1 className="opacity-50">
            Click on a star to add it to the flight plan
          </h1>
        ) : (
          <Tooltip content="Add Destination">
            <div
              className="w-8 h-8 rounded-full border border-dashed border-gray-400 flex justify-center items-center opacity-75 hover:opacity-100 cursor-pointer duration-100"
              onClick={() => {
                setFlightPlanningFor(carrier.id);
              }}
            >
              <Plus size={8} />
            </div>
          </Tooltip>
        )}
      </div>
    </Field>
  );
}
