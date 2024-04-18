import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Popover } from "react-tiny-popover";

const inter = Inter({ subsets: ["latin"] });

export function Tooltip({
  children,
  content,
  className,
  passThroughClassName,
  placement = "top",
  ...props
}: {
  content: JSX.Element | string | undefined;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
  children: JSX.Element | string;
  passThroughClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) {
    return <>{children}</>;
  }

  // place the placement value in the front of the array
  // so that it is the first one to be tried
  const positions = [
    placement,
    ...["top", "bottom", "left", "right"].filter((p) => p !== placement),
  ] as any;

  return (
    <Popover
      {...props}
      content={
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.15,
            restDelta: 0.0001,
            ease: "easeOut",
            duration: 0.1,
          }}
          className={classes(
            "primary-panel-solid-interactive active rounded text-sm",
            typeof content === "string" ? "px-2 py-1" : "px-2 py-2",
            inter.className,
            className
          )}
        >
          {content}
        </motion.div>
      }
      isOpen={isOpen}
      positions={positions}
      reposition
      align="center"
      padding={4}
      boundaryInset={16}
      onClickOutside={() => setIsOpen(false)}
    >
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={passThroughClassName}
      >
        {children}
      </span>
    </Popover>
  );
}
