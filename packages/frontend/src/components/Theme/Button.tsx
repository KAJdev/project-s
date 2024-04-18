import { ExternalLink, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

export function Button({
  children,
  className,
  tooltip,
  icon,
  loading = false,
  disabled = false,
  variant = "primary",
  active,
  onClick,
  href,
}: StyleableWithChildren & {
  icon?: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "transparent"
    | "nobg"
    | "danger"
    | "danger-transparent"
    | "outline"
    | "vibrant";
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  tooltip?: JSX.Element | string;
  href?: string;
}) {
  if (loading) {
    disabled = true;
  }

  const content = (
    <button
      className={classes(
        "flex gap-2 duration-100 rounded px-2 py-[0.4rem] text-sm items-center select-none cursor-default",
        variant === "primary" && "primary-panel-interactive",
        variant === "secondary" && "secondary-panel-interactive",
        variant === "transparent" && "transparent-panel-interactive",
        variant === "danger-transparent" &&
          "transparent-panel-interactive text-red-500",
        variant === "danger" && "danger-panel-interactive",
        variant === "nobg" && "opacity-50 hover:opacity-100",
        variant === "vibrant" && "vibrant-panel-interactive",
        variant === "outline" &&
          "transparent-panel-interactive ring-[1px] ring-white/[6%] ring-inset",
        active && "active",
        children === undefined && icon !== undefined
          ? "h-full aspect-square"
          : "",
        disabled ? "opacity-50 pointer-events-none" : "",
        className
      )}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }

        if (onClick) {
          onClick();
        }

        if (href) {
          window.open(href);
        }
      }}
    >
      {loading ? (
        <Loader2 className="text-white opacity-80 animate-spin" size={14} />
      ) : (
        icon
      )}
      {children}
      {href && <ExternalLink className="text-white opacity-80" size={14} />}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{content}</Tooltip>;
  }

  return content;
}
