import { mapState } from "@/lib/map";
import { StarInspect } from "./StarInspect";
import { SelfInspect } from "./SelfInspect";
import { CarrierInspect } from "./CarrierInspect";
import { Inspector } from "./Inspector";
import { Options } from "./Tabs/Options";
import { News as NewsPage } from "./Tabs/News";
import { Research } from "./Tabs/Research";
import { scanStore } from "@/lib/scan";

const currentTabs = {
  research: <Research />,
  news: <NewsPage />,
  options: <Options />,
} as const;

function TabButton({
  name,
  onClick,
  selected,
  className,
}: Styleable & {
  name: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={classes(
        "p-2 px-4 basis-auto grow shrink-0",
        selected ? "bg-white/20" : "bg-white/5 hover:bg-white/10",
        className
      )}
      onClick={onClick}
    >
      {name}
    </button>
  );
}

export function LeftInspector() {
  const { selected, flightPlanningFor } = mapState();
  const [tab, setTab] = useState<string>("research");

  const firstStar = selected.find((s) => s.type === "star");
  const carriers = selected.filter((s) => s.type === "carrier");
  const firstStarName = scanStore
    .getState()
    ?.scan?.stars.find((s) => s.id === firstStar?.id)?.name;

  return (
    <Inspector noPadding draggable={false} nothingMessage={null} parent>
      <SelfInspect />
      <div className="flex flex-wrap w-full border-b border-white/20">
        <TabButton
          className="sm:hidden"
          name="Map"
          onClick={() => setTab(null)}
          selected={!tab}
        />
        {Object.keys(currentTabs).map((key) => (
          <TabButton
            key={key}
            name={key}
            onClick={() => setTab(key as keyof typeof currentTabs)}
            selected={tab === key}
          />
        ))}
      </div>
      <div className="flex flex-col w-full overflow-y-auto">
        {tab && currentTabs[tab as keyof typeof currentTabs]}
        {carriers.length > 0 && (
          <CarrierInspect carrierIds={carriers.map((c) => c.id)} />
        )}
        {firstStar && <StarInspect starId={firstStar.id} />}
      </div>
    </Inspector>
  );
}
