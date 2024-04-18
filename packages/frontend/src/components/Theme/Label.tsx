export function Label({
  children,
  className,
  big = false,
}: StyleableWithChildren & { big?: boolean }) {
  return (
    <h3
      className={classes(
        "select-none font-[450]",
        big ? "text-base" : "text-xs opacity-50",
        className
      )}
    >
      {children}
    </h3>
  );
}
