import { scanStore, usePlayer, useScan } from "@/lib/scan";
import { Field, Inspector } from "./Inspector";
import { fetchGames, restartGame, useGame } from "@/lib/games";
import { Button } from "./Theme/Button";
import { TickIndicator } from "./TickIndicator";
import { Options } from "./Tabs/Options";
import { News as NewsPage } from "./Tabs/News";
import { Research } from "./Tabs/Research";

const TABS = {
  research: <Research />,
  news: <NewsPage />,
  options: <Options />,
} as const;

export function News() {}

export function SelfInspect() {
  const self = usePlayer();
  const scan = scanStore((state) => state.scan);
  const game = useGame(scan?.game);
  const [tab, setTab] = useState<keyof typeof TABS>("options");

  if (!self) {
    return null;
  }

  const ownedStars = scan?.stars.filter((s) => s.occupier === self.id);
  const totalEconomy =
    ownedStars?.reduce((acc, s) => acc + (s.economy ?? 0), 0) ?? 0;
  const cashPerHour =
    totalEconomy / game?.settings.production_cycle_length! / 0.25;

  return (
    <Inspector noPadding>
      <div className="flex justify-between p-4">
        <p style={{ color: self.color }}>{self.name}</p>
        <div className="flex gap-2 items-center">
          <p>
            ${self.cash?.toFixed(0)}
            <span className="text-green-500/75 ml-2 bg-white/10">
              +${cashPerHour.toFixed(2)}/hr
            </span>
          </p>
          <TickIndicator />
        </div>
      </div>
      <div className="flex flex-wrap w-[full">
        {Object.keys(TABS).map((key) => (
          <button
            key={key}
            className={classes(
              "p-2 px-4 basis-auto grow shrink-0",
              tab === key ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
            )}
            onClick={() => setTab(key as keyof typeof TABS)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="p-4 flex flex-col gap-2">
        {TABS[tab as keyof typeof TABS]}
      </div>
    </Inspector>
  );
}
