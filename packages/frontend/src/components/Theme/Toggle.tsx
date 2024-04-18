import { motion } from "framer-motion";

export function Toggle({
  className,
  checked,
  onChange,
  label,
  disabled,
}: {
  className?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [id] = useState(ID.create());
  return (
    <div
      className={classes(
        "flex items-center gap-2.5 text-white/60 text-sm cursor-pointer select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      onClick={() => onChange(!checked)}
    >
      {label && <p>{label}</p>}
      <div
        className={classes(
          "rounded-full bg-white/10 p-[3px] flex items-center justify-center duration-100",
          checked && "bg-indigo-600"
        )}
      >
        {checked && <motion.div className={classes("w-4 h-4")} />}
        <motion.div
          className={classes("rounded-full w-4 h-4 bg-white")}
          layout="position"
          transition={{
            type: "spring",
            stiffness: 2000,
            damping: 80,
          }}
        />
        {!checked && <motion.div className={classes("w-4 h-4")} />}
      </div>
    </div>
  );
}
