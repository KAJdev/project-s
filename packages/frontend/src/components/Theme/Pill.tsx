export function Pill({
  children,
  className,
  color,
}: StyleableWithChildren & { color?: string }) {
  return (
    <h3
      className={classes(
        "select-none font-[450] bg-white/5 text-xs px-2.5 flex items-center py-[0.2rem] text-white/60 ring-[1px] align-middle ring-white/10 ring-inset rounded-full gap-2",
        className
      )}
      style={
        color
          ? {
              borderColor: color,
            }
          : {}
      }
    >
      {color && (
        <div
          className="rounded-full w-2.5 h-2.5 shrink-0"
          style={{
            backgroundColor: color,
          }}
        />
      )}
      {children}
    </h3>
  );
}
