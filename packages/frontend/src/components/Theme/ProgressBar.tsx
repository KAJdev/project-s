export function ProgressBar({
  max,
  value,
  className,
}: Styleable & {
  max: number;
  value: number;
}) {
  return (
    <div
      className={classes(
        "w-full h-2 bg-white/10 border-collapse rounded-lg overflow-hidden",
        className
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}
