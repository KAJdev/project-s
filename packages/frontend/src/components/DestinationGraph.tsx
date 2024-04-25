/* eslint-disable @next/next/no-img-element */
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
import { Select } from "./Theme/Select";

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function GraphStar({ star }: { star: Star }) {
  const player = useSpecificPlayer(star.occupier);
  const [action, setAction] = useState<"collect" | "drop" | "nothing">(
    "collect"
  );
  return (
    <div className="flex justify-between gap-2 items-center w-full">
      <div className="flex items-center gap-2">
        <img
          className="w-8 h-8 rounded-full border-[3px]"
          style={{ borderColor: player?.color ?? "#888888" }}
          src={"/star.png"}
          alt={"star icon"}
        />
        <p>{star.name}</p>
      </div>
      <Tooltip content="Ship Action">
        <Select
          value={action}
          onChange={(e) => setAction(e)}
          className="w-fit"
          options={[
            { label: "Collect", value: "collect" },
            { label: "Drop", value: "drop" },
            { label: "Nothing", value: "nothing" },
          ]}
        />
      </Tooltip>
    </div>
  );
}

export function DestinationGraph({ carrier }: { carrier: Carrier }) {
  const stars = useStars(carrier.destination_queue.map((d) => d.star));
  const [flightPlanningFor, setFlightPlanningFor] = mapState((s) => [
    s.flightPlanningFor,
    s.setFlightPlanningFor,
  ]);

  return (
    <Field
      label="Flight Plan"
      variant="box"
      className={classes(
        "overflow-y-auto max-h-[10rem] relative",
        flightPlanningFor === carrier.id && "overflow-hidden"
      )}
    >
      <div className="relative w-full min-h-[5rem]">
        <div
          className={classes(
            "flex flex-col gap-0 p-1 items-center w-full",
            flightPlanningFor === carrier.id && "opacity-10"
          )}
        >
          {stars.map((star, i) => (
            <>
              <GraphStar key={star.id} star={star} />
              {i < stars.length - 1 && (
                <div className="w-8 mr-auto flex justify-center" key={i}>
                  <div className="w-0 h-3 border border-white/20 border-dotted" />
                </div>
              )}
            </>
          ))}
          <Button
            variant="outline"
            className={classes(
              "w-full justify-center mt-3",
              carrier.destination_queue.length === 0 && "py-8 mt-0"
            )}
            icon={<Plus size={14} />}
            onClick={() => setFlightPlanningFor(carrier.id)}
          >
            Add Destination
          </Button>
        </div>
      </div>
      {flightPlanningFor === carrier.id && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex flex-col items-center justify-center gap-2">
          <h1>Click on a star to add it to the flight plan</h1>
          <Button variant="vibrant" onClick={() => setFlightPlanningFor(null)}>
            Done
          </Button>
        </div>
      )}
    </Field>
  );
}
