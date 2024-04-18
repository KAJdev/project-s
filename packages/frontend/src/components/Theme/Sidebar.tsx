import { ReactNode } from "react";

export function Sidebar({
  children,
  className,
  bottom,
  side = "left",
}: StyleableWithChildren & { bottom?: ReactNode; side?: "left" | "right" }) {
  return (
    <div
      className={classes(
        "w-64 shrink-0 flex flex-col min-h-0 h-full overflow-y-auto justify-between border-white/[6%] bg-white/[2.5%] p-3",
        side === "right" ? "border-l" : "border-r",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">{children}</div>
      {bottom && <div className="flex flex-col">{bottom}</div>}
    </div>
  );
}
