import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { X } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const outSideVariants = {
  closed: {
    opacity: 0,
    transition: {
      type: "tween",
      duration: 0.1,
    },
  },
  open: {
    opacity: 1,
    transition: {
      type: "tween",
      duration: 0.1,
    },
  },
};

const insideVariants = {
  closed: {
    scale: 0.9,
    opacity: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 500,
      restSpeed: 10,
    },
  },
  open: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 500,
      restSpeed: 0.1,
    },
  },
};

export function Modal(
  props: StyleableWithChildren & {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }
) {
  const root = useMemo(() => document.getElementById("modal-root"), []);
  if (!root) {
    console.error("Could not find root element");
    return null;
  }

  const content = (
    <AnimatePresence>{props.open && <Open {...props} />}</AnimatePresence>
  );

  return createPortal(content, root);
}

function Open({
  open,
  onClose,
  children,
  className,
}: StyleableWithChildren & {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={classes(
        "fixed top-0 left-0 z-[1000] flex h-full w-full sm:h-screen bg-black/50 sm:w-screen sm:items-center sm:justify-center",
        !open && "pointer-events-none"
      )}
      variants={outSideVariants}
      initial="closed"
      animate={open ? "open" : "closed"}
      exit="closed"
      onClick={onClose}
    >
      <motion.div
        className={classes(
          !open && "pointer-events-none",
          "max-w-[30rem] w-full",
          className
        )}
        variants={insideVariants}
        initial="closed"
        animate={open ? "open" : "closed"}
        exit="closed"
        onClick={(e) => e.stopPropagation()}
      >
        {open && children}
      </motion.div>
    </motion.div>
  );
}

export function Panel({ className, children }: StyleableWithChildren) {
  return (
    <div
      className={classes(
        "flex flex-col rounded-md primary-panel-solid",
        "bg-opacity-70 backdrop-blur-3xl",
        inter.className,
        className
      )}
    >
      {children}
    </div>
  );
}

export function Title({ className, children }: StyleableWithChildren) {
  return (
    <h1 className={classes("text-left text-lg", className)}>{children}</h1>
  );
}

export function TopBar({
  className,
  children,
  onClose,
  border = true,
}: StyleableWithChildren & {
  onClose?: () => void;
  border?: boolean;
}) {
  return (
    <div
      className={classes(
        "flex flex-row items-center justify-between rounded-t-md py-3 px-5",
        border && "border-white/[6%] border-b",
        className
      )}
    >
      <div>{children}</div>
      {onClose && (
        <Button
          variant="nobg"
          className="cursor-pointer p-0"
          icon={<X size={18} />}
          onClick={() => onClose?.()}
        />
      )}
    </div>
  );
}

export function BottomBar({
  className,
  children,
  border = true,
}: StyleableWithChildren & {
  border?: boolean;
}) {
  return (
    <div
      className={classes(
        "flex flex-row items-center justify-between py-3 px-5",
        border && "border-white/[6%] border-t",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Body({ className, children }: StyleableWithChildren) {
  return <div className={classes("py-3 px-5 mb-3", className)}>{children}</div>;
}
