import {
  Carrier,
  Player,
  Star,
  buildCarrier,
  useCarrier,
  useCarriers,
  usePlayer,
  usePlayers,
  useSpecificPlayer,
  useStar,
  useStarCosts,
} from "@/lib/scan";
import { Field, Inspector } from "./Inspector";
import { Button } from "./Theme/Button";
import { Tooltip } from "./Theme/Tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Rocket } from "lucide-react";
import { DestinationGraph } from "./DestinationGraph";
import { mapState } from "@/lib/map";

function CarrierView({
  carrier,
  owner,
  defaultOpen,
  index,
}: {
  carrier: Carrier;
  owner: Player;
  defaultOpen?: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const self = usePlayer();
  return (
    <div className={classes(open && "mb-5 last:mb-0")}>
      <div
        key={carrier.id}
        className={classes(
          "flex gap-2 cursor-pointer select-none opacity-75 hover:opacity-100 duration-100 justify-between items-center",
          open && "opacity-100"
        )}
        onClick={() => setOpen(!open)}
      >
        <h1 className="text-lg">{carrier.name}</h1>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            <Rocket size={14} fill={owner.color} stroke={owner.color} />
            <p>{carrier.ships}</p>
          </div>
          <ChevronDown
            size={16}
            className={classes("duration-100", open && "transform rotate-180")}
          />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            className="flex flex-col gap-2"
            variants={{
              open: {
                opacity: 1,
                height: "auto",
                marginTop: "1rem",
              },
              collapsed: {
                opacity: 0,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
              },
            }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Field label="Owner">
              <div
                className="flex gap-2 items-center"
                style={{ color: owner.color }}
              >
                <p>{owner.name}</p>
              </div>
            </Field>
            {owner.id === self?.id && <DestinationGraph carrier={carrier} />}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CarrierInspect({ carrierIds }: { carrierIds: ID[] }) {
  const carriers = useCarriers(carrierIds);
  const player = usePlayer();
  const players = usePlayers(carriers?.map((c) => c.owner));
  const flightPlanningFor = mapState((s) => s.flightPlanningFor);

  if (carriers.length === 0) return null;

  return (
    <Inspector>
      <div className="flex flex-col gap-3">
        {carriers.map((carrier, i) => (
          <CarrierView
            key={carrier.id}
            carrier={carrier}
            owner={players.find((p) => p.id === carrier.owner)!}
            defaultOpen={
              carriers.length === 1 || flightPlanningFor === carrier.id
            }
            index={i}
          />
        ))}
      </div>
    </Inspector>
  );
}
