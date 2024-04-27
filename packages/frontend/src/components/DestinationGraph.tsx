/* eslint-disable @next/next/no-img-element */
import {
  Carrier,
  Star,
  editDestinationAction,
  removeCarrierDestination,
  usePlayers,
  useSpecificPlayer,
  useStars,
} from "@/lib/scan";
import { Field } from "./Inspector";
import { Loader, Plus, X } from "lucide-react";
import { Tooltip } from "./Theme/Tooltip";
import { mapState } from "@/lib/map";
import { Button } from "./Theme/Button";
import { Select } from "./Theme/Select";

function GraphStar({
  star,
  carrier,
  index,
}: {
  star: Star;
  carrier: Carrier;
  index: number;
}) {
  const player = useSpecificPlayer(star.occupier);
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
      <div className="flex gap-2 items-center">
        {index === carrier.destination_queue.length - 1 && index > 0 && (
          <Tooltip content="Remove Destination">
            <X
              onClick={() => {
                removeCarrierDestination(carrier.id);
              }}
              className="cursor-pointer opacity-50 hover:opacity-100"
            />
          </Tooltip>
        )}
        <Select
          value={carrier.destination_queue[index].action ?? ""}
          onChange={(e) => editDestinationAction(carrier.id, index, e || null)}
          fullWidth
          className="w-[7rem]"
          options={[
            { label: "Collect", value: "collect" },
            { label: "Drop", value: "drop" },
            { label: "Nothing", value: "" },
          ]}
        />
      </div>
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
              <GraphStar
                key={star.id}
                star={star}
                carrier={carrier}
                index={i}
              />
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