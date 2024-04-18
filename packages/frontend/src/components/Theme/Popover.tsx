import { createPortal } from "react-dom";
import {
  useClickAway,
  useMouseWheel,
  useScroll,
  useWindowSize,
} from "react-use";

export function Popover({
  children,
  className,
  content,
  open,
  onClose,
  location,
  side,
  ...props
}: StyleableWithChildren & {
  content: React.ReactNode;
  className?: string;
  open: boolean;
  onClose: () => void;
  location?: "top" | "bottom";
  side?: "left" | "right";
  [key: string]: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const clickRef = useRef<HTMLDivElement>(null);
  const size = useWindowSize();
  const mw = useMouseWheel();
  useClickAway(clickRef, onClose);

  const [locationState, setLocationState] = useState<"top" | "bottom">(
    location ?? "bottom"
  );
  const [sideState, setSideState] = useState<"left" | "right">(side ?? "left");

  const root = useMemo(() => document.getElementById("popover-root"), []);

  // make sure the content doesn't overflow the screen

  console.log(locationState, sideState);

  const popover = (
    <div
      className="z-[10] absolute duration-100"
      style={{
        marginTop: locationState === "bottom" ? 8 : undefined,
        marginBottom: locationState === "top" ? 8 : undefined,
        left:
          sideState === "left"
            ? ref.current?.getBoundingClientRect().left
            : (ref.current?.getBoundingClientRect().left ?? 0) +
              (ref.current?.getBoundingClientRect().width ?? 0),
        top:
          locationState === "top"
            ? (ref.current?.getBoundingClientRect().top ?? 0) -
              (ref.current?.getBoundingClientRect().height ?? 0)
            : (ref.current?.getBoundingClientRect().top ?? 0) +
              (ref.current?.getBoundingClientRect().height ?? 0),
      }}
      ref={clickRef}
    >
      {content}
    </div>
  );

  useEffect(() => {
    if (!clickRef.current) return;
    const rect = clickRef.current.getBoundingClientRect();
    console.log(rect);
    if (rect.top < 0) {
      setLocationState("bottom");
    } else if (rect.bottom > window.innerHeight) {
      setLocationState("top");
    }
    if (rect.left < 0) {
      setSideState("right");
    } else if (rect.right > window.innerWidth) {
      setSideState("left");
    }
  }, [
    ref.current?.offsetLeft,
    ref.current?.offsetTop,
    size.width,
    size.height,
    mw,
    open,
  ]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  if (!root) {
    console.error("Could not find root element");
    return null;
  }

  return (
    <div {...props} ref={ref} className={classes("relative", className)}>
      <div className="flex items-center">{children}</div>
      {open && createPortal(popover, root)}
    </div>
  );
}
