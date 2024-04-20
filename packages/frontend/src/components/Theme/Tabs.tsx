export function Tabs({
  options,
  value,
  className,
  onChange,
}: Styleable & {
  options: {
    label: React.ReactNode;
    value: string;
  }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const hasTextOptions = options
    .map((o) => o.label)
    .some((label) => typeof label === "string");

  return (
    <div
      className={classes(
        "flex duration-100 text-sm items-center select-none cursor-default bg-white/5",
        hasTextOptions ? "p-1.5 gap-2" : "gap-0",
        className
      )}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className={classes(
            "flex items-center justify-center duration-100 px-2 py-[0.4rem]",
            value === option.value
              ? "primary-panel-solid"
              : "opacity-40 hover:opacity-100"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
