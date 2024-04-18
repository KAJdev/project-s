import { Loader2, X } from "lucide-react";
import { Label } from "./Label";

export function Input({
  label,
  icon,
  startIcon,
  placeholder,
  value,
  className,
  onChange,
  onClear,
  autoFocus,
  disabled = false,
  clearable,
  loading,
  ...props
}: Styleable &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    label?: string;
    icon?: React.ReactNode;
    startIcon?: React.ReactNode;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    autoFocus?: boolean;
    disabled?: boolean;
    clearable?: boolean;
    loading?: boolean;
  }) {
  const [focused, setFocused] = useState(false);

  const startingIcon = clearable
    ? icon && <div className="ml-2">{icon}</div>
    : startIcon && <div className="ml-2">{startIcon}</div>;
  let endIcon =
    clearable && value ? (
      <div
        className={classes("mr-2 cursor-pointer")}
        onClick={() => (onClear ? onClear() : onChange(""))}
      >
        <X size={14} />
      </div>
    ) : (
      icon && <div className="mr-2">{icon}</div>
    );

  if (loading) {
    disabled = true;
    endIcon = <Loader2 size={14} className="animate-spin shrink-0 mr-2" />;
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <div
        className={classes(
          "flex duration-100 rounded text-sm items-center select-none primary-panel-interactive",
          "border-transparent",
          focused && "active",
          Boolean(disabled) ? "opacity-50 pointer-events-none" : "",
          className
        )}
      >
        {startingIcon}
        <input
          type="text"
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="px-2 py-[0.4rem] bg-transparent focus:outline-none w-full"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
        />
        {endIcon}
      </div>
    </div>
  );
}
