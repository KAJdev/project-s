import { useCensus } from "@/lib/census";
import { scanStore } from "@/lib/scan";
import dynamic from "next/dynamic";
import { Select } from "../Theme/Select";
import { useMeasure } from "react-use";

const Line = dynamic(() => import("@nivo/line").then((mod) => mod.Line), {
  ssr: false,
});

const ASPECTS = {
  stars: "Stars",
  economy: "Economy",
  industry: "Industry",
  science: "Science",
  ships: "Ships",
  carriers: "Carriers",
  cash: "Credits",

  // only research
  weapons: "Weapons",
  banking: "Banking",
  manufacturing: "Manufacturing",
  hyperspace: "Hyperspace",
  scanning: "Scanning",
  experimentation: "Experimentation",
  terraforming: "Terraforming",
} as const;

const RESEARCH_ASPECTS = [
  "weapons",
  "banking",
  "manufacturing",
  "hyperspace",
  "scanning",
  "experimentation",
  "terraforming",
] as const;

export function Census() {
  const scan = scanStore((state) => state.scan);
  const censusPoints = useCensus(scan?.game);
  const [aspect, setAspect] = useState<keyof typeof ASPECTS>("stars");
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  if (!scan) return <div className="p-4">No game selected...</div>;

  if (censusPoints.length < 1)
    return <div className="p-4">No census data yet...</div>;

  const data = scan.players.map((p) => ({
    color: p.color,
    id: p.name,
    data: censusPoints.map((point) => {
      const playerPoint = point.players.find((pdata) => pdata.player === p.id);

      let value =
        // @ts-ignore
        playerPoint?.[
          RESEARCH_ASPECTS.includes(aspect) ? "research_levels" : aspect
        ];

      if (RESEARCH_ASPECTS.includes(aspect) && value) {
        value = value[aspect];
      }

      return {
        color: p.color,
        x: new Date(point.created_at),
        y: value,
      };
    }),
  }));

  return (
    <div className="flex flex-col gap-2 p-4 max-h-[40rem] overflow-y-auto">
      <Select
        value={aspect}
        onChange={(e) => setAspect(e)}
        options={Object.entries(ASPECTS).map(([value, label]) => ({
          value,
          label,
        }))}
        fullWidth
      />
      <div ref={ref} className="w-full overflow-hidden">
        <Line
          animate
          motionConfig={"stiff"}
          isInteractive
          curve="linear"
          data={data}
          height={400}
          width={width}
          yScale={{
            type: "linear",
            stacked: false,
          }}
          colors={{
            datum: "color",
          }}
          enablePointLabel={false}
          enablePoints={false}
          enableSlices="x"
          enableArea
          enableTouchCrosshair
          pointBorderColor={{
            theme: "background",
          }}
          margin={{
            top: 0,
            right: 0,
            bottom: 30,
            left: 30,
          }}
          theme={{
            text: {
              color: "white",
              fontFamily: "inherit",
            },
            tooltip: {
              container: {
                background: "#0f1722bb",
                // bg blur
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "0",
                fontSize: "11px",
                fontFamily: "inherit",

                // get rid of shadows
                boxShadow: "none",
              },
            },
            grid: {
              line: {
                stroke: "rgba(255, 255, 255, 0.1)",
              },
            },
            crosshair: {
              line: {
                stroke: "rgba(255, 255, 255, 0.5)",
              },
            },
            annotations: {
              text: {
                fill: "white",
              },
            },
            axis: {
              legend: {
                text: {
                  fill: "rgba(255, 255, 255, 0.5)",
                  fontFamily: "inherit",
                },
              },
              ticks: {
                line: {
                  stroke: "rgba(255, 255, 255, 0.1)",
                },
                text: {
                  fill: "white",
                },
              },
            },
          }}
          axisBottom={{
            tickValues: "every 2 hours",
            format: "%H:%M",
          }}
          xScale={{
            type: "time",
            useUTC: false,
          }}
          enableGridY={false}
          enableGridX={false}
        />
      </div>
    </div>
  );
}
