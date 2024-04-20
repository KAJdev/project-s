import { Info } from "lucide-react";

export function Note({ className, children }: StyleableWithChildren) {
  return (
    <div
      className={classes(
        "bg-indigo-900/25 border border-indigo-700/25 text-white/75 text-sm p-3 items-center flex gap-3 group",
        className
      )}
    >
      <Info size={14} color="currentColor" className="shrink-0 my-auto" />{" "}
      {children}
    </div>
  );
}
