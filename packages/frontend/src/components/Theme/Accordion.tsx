import { AnimatePresence, motion } from "framer-motion";

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
  return (
    <div className={classes(open && "mb-5 last:mb-0")}>
      {title && (
        <div
          className={classes(
            "flex gap-2 cursor-pointer select-none opacity-75 hover:opacity-100 duration-100 justify-between items-center",
            open && "opacity-100",
            className
          )}
          onClick={() => onOpenChange(!open)}
        >
          {title}
        </div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            className="flex flex-col gap-2"
            variants={{
              open: {
                opacity: 1,
                height: "auto",
                marginTop: "1rem",
              },
              collapsed: {
                opacity: 0,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
              },
            }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {children}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
