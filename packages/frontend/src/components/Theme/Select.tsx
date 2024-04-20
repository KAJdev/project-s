import { ChevronDown } from "lucide-react";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { Popover } from "react-tiny-popover";

const inter = Inter({ subsets: ["latin"] });

export function Select({
  className,
  icon,
  disabled,
  variant = "primary",
  onChange,
  value,
  options,
  placeholder,
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
  options: { label: string; value: string; icon?: ReactNode }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options?.find((option) => option.value === value);
  return (
    <Popover
      isOpen={open}
      onClickOutside={() => setOpen(false)}
      positions={["bottom"]}
      padding={4}
      boundaryInset={16}
      content={
        <div
          className={classes(
            "primary-panel-solid-interactive active p-1 gap-0.5 w-[12rem] flex flex-col overflow-y-auto max-h-[30rem] min-h-0 drop-shadow-xl",
            inter.className
          )}
        >
          {options.map((option) => (
            <div
              className={classes(
                "transparent-panel-interactive flex items-center gap-2 px-1.5 py-1",
                option.value === value && "active"
              )}
              key={option.value}
              onClick={(e) => {
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
}
