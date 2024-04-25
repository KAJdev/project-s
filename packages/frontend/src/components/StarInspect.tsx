import {
  Carrier,
  Player,
  Star,
  buildCarrier,
  transferShips,
  upgradeStar,
  useCarriersAround,
  usePlayer,
  useSpecificPlayer,
  useStar,
  useStarCosts,
} from "@/lib/scan";
import { Field, Inspector } from "./Inspector";
import { Button } from "./Theme/Button";
import { Tooltip } from "./Theme/Tooltip";
import { Select } from "./Theme/Select";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Rocket,
  Sparkle,
} from "lucide-react";
import { Slider } from "./Theme/Slider";
import { mapState } from "@/lib/map";

export function StarAspect({
  star,
  starCosts,
  player,
  aspect,
  sublabel,
}: {
  star: Star;
  starCosts: {
    economy: number;
    industry: number;
    science: number;
    warp_gate: number;
  };
  player?: Player;
  aspect: "economy" | "industry" | "science";
  sublabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Field variant="box" label={aspect} sublabel={sublabel}>
      <p className="w-full text-center text-2xl">{star[aspect]}</p>
      {player?.id === star.occupier && (
        <Button
          className="w-full justify-center mt-2 pr-0 py-0"
          variant="vibrant"
          loading={loading}
          onClick={() => {
            setLoading(true);
            upgradeStar(star.id, aspect).finally(() => setLoading(false));
          }}
          disabled={starCosts[aspect] > (player?.cash ?? 0)}
        >
          <p className="px-2 py-[0.4rem] w-full text-left">Upgrade </p>
          <p className="px-3 py-[0.4rem] shrink-0 bg-white/10">
            ${starCosts[aspect].toFixed(0)}
          </p>
        </Button>
      )}
    </Field>
  );
}

function TransferShips({
  star,
  carriers,
}: {
  star: Star;
  carriers: Carrier[];
}) {
  const [transfering, setTransfering] = useState(false);
  const [from, setFrom] = useState<ID | null>(star.id);
  const [to, setTo] = useState<ID | null>(carriers[0]?.id ?? null);
  const [amount, setAmount] = useState(0);
  const options = carriers
    .map((c) => ({
      label: (
        <p className="text-xs flex gap-1.5">
          <span className="truncate">{c.name}</span>{" "}
          <span className="opacity-50 shrink-0">({c.ships})</span>
        </p>
      ),
      value: c.id,
      icon: <Rocket size={14} />,
    }))
    .concat([
      {
        label: (
          <p className="text-xs flex gap-1.5">
            <span className="truncate">{star.name}</span>{" "}
            <span className="opacity-50 shrink-0">({star.ships})</span>
          </p>
        ),
        value: star.id,
        icon: <Sparkle size={14} />,
      },
    ]);

  const arrowProps = {
    className: classes(
      "opacity-75 cursor-pointer hover:opacity-100 shrink-0 mx-4",
      amount === 0 && "opacity-50"
    ),
    size: 16,
    onClick: () => {
      setFrom(to);
      setTo(from);
      setAmount(-amount);
    },
  };

  const entities = carriers
    .map(
      (c) => ({ ...c, type: "carrier" } as (Carrier | Star) & { type: string })
    )
    .concat([{ ...star, type: "star" }]);

  const fromEntity = entities.find((e) => e.id === from);
  const toEntity = entities.find((e) => e.id === to);

  const min = -toEntity?.ships! + (toEntity?.type === "carrier" ? 1 : 0);
  const max = fromEntity?.ships! - (fromEntity?.type === "carrier" ? 1 : 0);

  return (
    <Field label="Transfer Ships" variant="box">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center justify-between">
          <Select
            options={options.map((o) => ({
              ...o,
              disabled: o.value === to,
            }))}
            value={from}
            onChange={(v) => {
              setFrom(v);
              setAmount(0);
            }}
            placeholder="From"
            fullWidth
            variant="secondary"
          />

          {amount < 0 && <ArrowLeft {...arrowProps} />}
          {amount === 0 && <ArrowRightLeft {...arrowProps} />}
          {amount > 0 && <ArrowRight {...arrowProps} />}

          <Select
            options={options.map((o) => ({
              ...o,
              disabled: o.value === from,
            }))}
            value={to}
            onChange={(v) => {
              setTo(v);
              setAmount(0);
            }}
            placeholder="To"
            fullWidth
            variant="secondary"
          />
        </div>
        <div className="flex justify-between items-center select-none text-lg mb-2 gap-2">
          <p className="border border-white/10 px-2 shrink-0">
            {fromEntity?.ships! - amount}
          </p>
          {/* <div className="w-full border border-white/10 border-dashed" /> */}
          <Slider
            min={min}
            max={max}
            disabled={max === min}
            value={amount}
            onChange={(v) => setAmount(v)}
          />
          <p className="border border-white/10 px-2 shrink-0">
            {toEntity?.ships! + amount}
          </p>
        </div>
        <Button
          variant="vibrant"
          className="w-full justify-center"
          disabled={amount === 0}
          loading={transfering}
          onClick={() => {
            setTransfering(true);
            let f = amount > 0 ? from : to;
            let t = amount > 0 ? to : from;
            transferShips(f, t, Math.abs(amount)).finally(() => {
              setTransfering(false);
              setAmount(0);
            });
          }}
        >
          Transfer
        </Button>
      </div>
    </Field>
  );
}

export function StarInspect({ starId }: { starId: ID }) {
  const star = useStar(starId);
  const player = usePlayer();
  const occupier = useSpecificPlayer(star?.occupier || "");
  const starCosts = useStarCosts(starId);
  const carriers = useCarriersAround(star?.position);
  const [buildCarrierLoading, setBuildCarrierLoading] = useState(false);
  const [buildWarpGateLoading, setBuildWarpGateLoading] = useState(false);
  if (!star)
    return <Inspector title="unknown" nothingMessage="No star found." />;

  return (
    <Inspector
      title={star.name}
      subtitle="Star"
      nothingMessage="No star selected"
    >
      {exists(star.resources) && (
        <>
          <div className="flex">
            <StarAspect
              star={star}
              starCosts={starCosts}
              player={player}
              aspect="economy"
            />
            <StarAspect
              star={star}
              starCosts={starCosts}
              player={player}
              aspect="industry"
            />
            <StarAspect
              star={star}
              starCosts={starCosts}
              player={player}
              aspect="science"
            />
          </div>
          <hr className="border-white/30 my-5" />
        </>
      )}
      <Field label="Occupied By">
        <p
          style={{
            color: occupier ? occupier.color : "gray",
          }}
        >
          {occupier ? occupier.name : "NULL"}
        </p>
      </Field>
      <Field
        label="Resources"
        sublabel={
          exists(star.resources)
            ? "Higher resources make star upgrades cheaper"
            : undefined
        }
      >
        {exists(star.resources) ? (
          <p>
            {star.resources}
            {player?.id === star.occupier && (
              <>
                <Tooltip
                  content={`Terraforming level ${
                    player?.research_levels.terraforming ?? 1
                  }`}
                >
                  <span className="opacity-50">{` + ${
                    (player?.research_levels.terraforming ?? 1) * 5
                  }`}</span>
                </Tooltip>
                <span>{` = ${
                  star.resources! +
                  (player?.research_levels.terraforming ?? 1) * 5
                }`}</span>
              </>
            )}
            {` `}
            <span className="opacity-50">{`(${(
              (star.resources! / 50) *
              100
            ).toFixed(0)}%)`}</span>
          </p>
        ) : (
          "UNKNOWN"
        )}
      </Field>
      {exists(star.ships) && <Field label="Ships">{star.ships}</Field>}
      <Field label="Coordinates">
        ({star.position.x.toFixed(4)} LY, {star.position.y.toFixed(4)} LY)
      </Field>
      {exists(star.resources) && (
        <>
          <hr className="border-white/30 my-5" />
          <Field
            label="Warp Gate"
            sublabel="Allows warp speed travel between stars"
          >
            {player?.id === star.occupier &&
              (!star.warp_gate ? (
                <Button
                  className="w-full justify-center mt-2 pr-0 py-0"
                  variant="vibrant"
                  onClick={() => {
                    console.log(`Upgrade warp gate`);
                  }}
                  disabled={starCosts.warp_gate > (player?.cash ?? 0)}
                  loading={buildWarpGateLoading}
                >
                  <p className="px-2 py-[0.4rem] w-full text-left">Build </p>
                  <p className="px-3 py-[0.4rem] shrink-0 bg-white/10">
                    ${starCosts.warp_gate.toFixed(0)}
                  </p>
                </Button>
              ) : (
                <p className="text-center text-green-500">Operational</p>
              ))}
          </Field>

          <Field
            label="Ship Carrier"
            sublabel="Allows for ship transport between stars"
          >
            {player?.id === star.occupier && (
              <Button
                className="w-full justify-center mt-2 pr-0 py-0"
                variant="vibrant"
                onClick={() => {
                  setBuildCarrierLoading(true);

                  buildCarrier(star.id)
                    .then((newcarrier) => {
                      if (!newcarrier) return;
                      mapState.getState().addSelected({
                        id: newcarrier.id,
                        type: "carrier",
                      });
                      mapState.getState().setFlightPlanningFor(newcarrier.id);
                    })
                    .finally(() => setBuildCarrierLoading(false));
                }}
                disabled={(player?.cash ?? 0) < 25 || (star.ships ?? 0) < 1}
                loading={buildCarrierLoading}
              >
                <p className="px-2 py-[0.4rem] w-full text-left">Build </p>
                <p className="px-3 py-[0.4rem] shrink-0 bg-white/10">$25</p>
              </Button>
            )}
          </Field>
        </>
      )}
      {occupier?.id === player?.id && carriers.length > 0 && (
        <>
          <hr className="border-white/30 my-5" />
          <TransferShips star={star} carriers={carriers} key={star.id} />
        </>
      )}
    </Inspector>
  );
}
