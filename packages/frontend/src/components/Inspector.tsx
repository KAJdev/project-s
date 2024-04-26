import { X } from "lucide-react";

export function Inspector({
  children,
  title,
  subtitle,
  superTitle,
  nothingMessage = "N/A",
  className,
  noPadding,
  draggable = true,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  superTitle?: string;
  nothingMessage?: string;
  noPadding?: boolean;
  draggable?: boolean;
  onClose?: () => void;
} & StyleableWithChildren) {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="max-w-[35rem] pointer-events-auto w-full flex flex-col h-fit border border-white/20 bg-[#0f1722]/70 backdrop-blur-md"
      style={{
        transform: `translate(${localPosition.x}px, ${localPosition.y}px)`,
        position: draggable ? "fixed" : "initial",
        zIndex: 100,
      }}
      onMouseDown={(e) => {
        if (draggable) {
          setDragging(true);
          const { x, y } = localPosition;
          const offsetX = e.clientX - x;
          const offsetY = e.clientY - y;

          window.document.body.style.cursor = "grabbing";
          window.document.body.style.userSelect = "none";

          const onMouseMove = (e: MouseEvent) => {
            setLocalPosition({
              x: e.clientX - offsetX,
              y: e.clientY - offsetY,
            });
          };

          const onMouseUp = () => {
            setDragging(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.document.body.style.cursor = "";
            window.document.body.style.userSelect = "";
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        }
      }}
    >
      {draggable && (
        <div className="w-full h-[2rem] bg-white/20 p-1 flex items-center justify-end">
          {onClose && (
            <X
              size={18}
              className="opacity-20 hover:opacity-100 hover:bg-white/75 hover:text-black"
              onClick={onClose}
            />
          )}
        </div>
      )}
      {title && (
        <div className="border-b border-white/20 w-full p-4">
          {superTitle && <p className="text-xs opacity-50">{superTitle}</p>}
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm opacity-50">{subtitle}</p>}
        </div>
      )}
      <div
        className={classes(
          "w-full flex flex-col gap-2",
          noPadding ? "" : "p-4"
        )}
      >
        {children ?? (
          <div className="h-[10rem] flex justify-center items-center opacity-50">
            {nothingMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  sublabel,
  children,
  className,
  variant = "horizontal",
}: {
  label: string;
  sublabel?: string;
  variant?: "horizontal" | "box";
} & StyleableWithChildren) {
  if (variant === "horizontal") {
    return (
      <div className="flex flex-col justify-center">
        <div className="flex items-center justify-between w-full gap-2">
          <p className="shrink-0 uppercase">{label}</p>
          <div className="my-auto grow border-b border-white/10 border-dashed" />
          <div className="shrink-0">{children}</div>
        </div>
        {sublabel && <p className="text-xs opacity-50">{sublabel}</p>}
      </div>
    );
  }

  if (variant === "box") {
    return (
      <div className="w-full border border-white/20">
        <div className="bg-white/10 flex flex-col items-center justify-center w-full p-2">
          <p className="uppercase">{label}</p>
          {sublabel && <p className="text-xs opacity-50">{sublabel}</p>}
        </div>
        <div className={classes("p-2", className)}>{children}</div>
      </div>
    );
  }
}
