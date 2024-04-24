import {
  Carrier,
  Star,
  removeCarrierDestination,
  usePlayers,
  useSpecificPlayer,
  useStars,
} from "@/lib/scan";
import { Field } from "./Inspector";
import { Plus, X } from "lucide-react";
import { Tooltip } from "./Theme/Tooltip";
import { mapState } from "@/lib/map";
import { Button } from "./Theme/Button";

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
      <div className="relative">
        <div
          className={classes(
            "flex my-5 justify-center items-center",
            flightPlanningFor === carrier.id && "opacity-10"
          )}
        >
          {stars.map((star, i) => (
            <>
              <GraphStar key={star.id} star={star} />
              <div className="w-8 flex items-center justify-center group relative">
                <div className="w-8 border border-dashed border-white/10 relative" />
                {i === stars.length - 1 &&
                  carrier.destination_queue.length > 1 && (
                    <Tooltip
                      content="Remove Destination"
                      passThroughClassName="absolute"
                    >
                      <X
                        size={18}
                        className="cursor-pointer opacity-0 group-hover:opacity-75"
                        onClick={() => {
                          removeCarrierDestination(carrier.id);
                        }}
                      />
                    </Tooltip>
                  )}
              </div>
            </>
          ))}
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
        </div>
        {flightPlanningFor === carrier.id && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex flex-col items-center justify-center gap-2">
            <h1>Click on a star to add it to the flight plan</h1>
            <Button
              variant="vibrant"
              onClick={() => setFlightPlanningFor(null)}
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </Field>
  );
}
