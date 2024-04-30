import { ChevronDown, X } from "lucide-react";
import { ReactNode } from "react";

export function Inspector({
  children,
  title,
  subtitle,
  superTitle,
  nothingMessage = "N/A",
  className,
  noPadding,
  draggable = true,
  parent = false,
  dividerText,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  superTitle?: string;
  nothingMessage?: string | null;
  noPadding?: boolean;
  draggable?: boolean;
  onClose?: () => void;
  dividerText?: string;
  parent?: boolean;
} & StyleableWithChildren) {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(true);

  return (
    <>
      {dividerText && (
        <div
          className="w-full h-[2rem] shrink-0 bg-white/20 flex items-center justify-between px-4 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <p className="text-sm opacity-50">{dividerText}</p>
          <ChevronDown
            size={16}
            className={classes("duration-100", open && "transform rotate-180")}
          />
        </div>
      )}
      {(open || !dividerText) && (
        <div
          className={classes(
            "sm:max-w-[35rem] pointer-events-auto w-full flex flex-col h-fit",
            parent &&
              "sm:border-x border-y border-white/20 bg-[#0f1722]/70 backdrop-blur-md overflow-y-auto min-h-0 max-h-full"
          )}
        >
          {draggable && (
            <div
              className="w-full h-[2rem] bg-white/20 p-1 flex items-center justify-end"
              onMouseDown={(e) => {
                if (draggable) {
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
            <div className={classes("w-full p-4 border-b border-white/20")}>
              {superTitle && <p className="text-xs opacity-50">{superTitle}</p>}
              <h2 className="text-xl font-bold">{title}</h2>
              {subtitle && <p className="text-sm opacity-50">{subtitle}</p>}
            </div>
          )}
          {(children || nothingMessage) && (
            <div
              className={classes(
                "w-full flex flex-col min-h-0",
                noPadding ? "" : "p-4",
                !parent && "gap-2"
              )}
            >
              {children ?? (
                <div className="h-[10rem] flex justify-center items-center opacity-50">
                  {nothingMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function Field({
  label,
  sublabel,
  children,
  className,
  variant = "horizontal",
}: {
  label?: string;
  sublabel?: ReactNode;
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
        {sublabel && typeof sublabel === "string" ? (
          <p className="text-xs opacity-50">{sublabel}</p>
        ) : (
          sublabel
        )}
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
