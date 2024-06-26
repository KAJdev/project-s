import { scanStore } from "@/lib/scan";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Tooltip } from "./Theme/Tooltip";
import { useShallow } from "zustand/react/shallow";

export function TickIndicator() {
  const lastTick = scanStore(useShallow((s) => s.lastTick));
  const [secondsSinceLastTick, setSecondsSinceLastTick] =
    React.useState<number>(
      Date.now() - (lastTick ?? Date.now() - (Date.now() % 60000))
    );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceLastTick((s) => s + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSecondsSinceLastTick(
      Date.now() - (lastTick ?? Date.now() - (Date.now() % 60000))
    );
  }, [lastTick]);

  const value = 100 - (secondsSinceLastTick / 1000 / 60) * 100;
  const countdown = 60 - secondsSinceLastTick / 1000;

  return (
    <Tooltip
      content={
        countdown > 0
          ? `Tick countdown: ${countdown.toFixed()}`
          : "Waiting for next tick..."
      }
      placement="right"
    >
      <div className="text-xs text-gray-400 w-5 h-5">
        {value < 0 ? (
          <div className="w-full h-full rounded-full bg-red-500 animate-pulse" />
        ) : (
          <CircularProgressbar
            value={value}
            strokeWidth={30}
            styles={{
              path: {
                stroke: "rgba(255, 255, 255, 0.7)",
                strokeLinecap: "butt",
              },
              trail: {
                stroke: "rgba(255, 255, 255, 0.1)",
              },
            }}
          />
        )}
      </div>
    </Tooltip>
  );
}
