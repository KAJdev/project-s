import { motion } from "framer-motion";

export function Accordion({
  className,
  children,
  title,
  open,
  onOpenChange,
}: StyleableWithChildren & {
  title: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [id] = useState(ID.create());
  return (
    <div className={classes("flex flex-col", className)}>
      <div
        className={classes(
          "flex items-center justify-between select-none",
          open && "text-white/80",
          !open && "text-white/60"
        )}
        onClick={() => onOpenChange(!open)}
      >
        <h3 className="font-[500] text-sm">{title}</h3>
        <div
          className={classes(
            "rounded-full w-5 h-5 flex items-center justify-center duration-100",
            open && "bg-white/10"
          )}
        >
          <motion.div
            className={classes(
              "w-2.5 h-[1px] bg-white/60 rounded-full",
              open && "w-3.5 h-[2px] bg-white"
            )}
            layout="position"
            transition={{
              type: "spring",
              stiffness: 2000,
              damping: 80,
            }}
          />
        </div>
      </div>
      <motion.div
        className={classes("overflow-hidden", open && "max-h-[1000px] py-2")}
        layout="position"
        transition={{
          type: "spring",
          stiffness: 2000,
          damping: 80,
        }}
      >
        <div className="flex flex-col gap-2.5">{children}</div>
      </motion.div>
    </div>
  );
}
