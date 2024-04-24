import { ChevronDown } from "lucide-react";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { Popover } from "react-tiny-popover";
import { font } from "@/pages/_app";
import { useMeasure } from "react-use";

export function Select({
  className,
  icon,
  disabled,
  variant = "primary",
  onChange,
  value,
  options,
  placeholder,
  popoverClassName,
  fullWidth,
}: Styleable & {
  icon?: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "transparent"
    | "nobg"
    | "danger"
    | "vibrant";
  disabled?: boolean;
  onChange?: (value: any) => void;
  value?: string;
  options: {
    label: ReactNode;
    value: string;
    icon?: ReactNode;
    disabled: boolean;
  }[];
  placeholder?: string;
  popoverClassName?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options?.find((option) => option.value === value);

  const [ref, { width }] = useMeasure<HTMLSelectElement>();

  const content = (
    <Popover
      isOpen={open}
      onClickOutside={() => setOpen(false)}
      positions={["bottom"]}
      padding={4}
      containerStyle={{
        zIndex: "999999",
      }}
      boundaryInset={16}
      content={
        <div
          className={classes(
            "primary-panel-solid active p-1 gap-0.5 flex flex-col overflow-y-auto max-h-[30rem] min-h-0 drop-shadow-xl",
            fullWidth ? "w-full" : "w-[12rem]",
            font.className,
            popoverClassName
          )}
          style={
            fullWidth
              ? {
                  width: width,
                }
              : undefined
          }
        >
          {options.map((option) => (
            <div
              className={classes(
                "transparent-panel-interactive flex items-center gap-2 px-1.5 py-1",
                option.value === value && "active",
                option.disabled && "opacity-50 pointer-events-none"
              )}
              key={option.value}
              onClick={(e) => {
                if (option.disabled) return;
                onChange?.(option.value);
                setOpen(false);
              }}
            >
              {option.icon}
              <h1 className="opacity-70 text-sm select-none truncate">
                {option.label}
              </h1>
            </div>
          ))}
        </div>
      }
    >
      <div
        // ref={ref as any}
        className={classes(
          "flex gap-2 duration-100 px-2 py-[0.4rem] text-sm items-center select-none cursor-default w-[12rem]",
          variant === "primary" && "primary-panel-interactive",
          variant === "secondary" && "secondary-panel-interactive",
          variant === "transparent" && "transparent-panel-interactive",
          variant === "danger" && "danger-panel-interactive",
          variant === "nobg" && "opacity-50 hover:opacity-100",
          variant === "vibrant" && "vibrant-panel-interactive",
          open && "active",
          disabled && "opacity-50 pointer-events-none",
          fullWidth && "w-full",
          className
        )}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {current ? (
          <>
            {current.icon}
            {current.label}
          </>
        ) : (
          <>
            {icon}
            {placeholder}
          </>
        )}
        <ChevronDown className="opacity-50 ml-auto" size={16} />
      </div>
    </Popover>
  );

  if (fullWidth) {
    return (
      <div ref={ref as any} className="w-full">
        {content}
      </div>
    );
  }

  return content;
}
