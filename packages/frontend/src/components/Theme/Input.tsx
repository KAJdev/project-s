import { Loader2, X } from "lucide-react";
import { Label } from "./Label";

export function Input({
  label,
  icon,
  startIcon,
  placeholder,
  value,
  className,
  onChange: onChangeProp,
  onClear,
  autoFocus,
  disabled = false,
  clearable,
  loading,
  type = "text",
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

  const min = props.min ? +props.min : 0;
  const max = props.max ? +props.max : Infinity;

  const onChange = (value: string) => {
    if (disabled) return;
    if (type === "number" && isNaN(+value)) return;
    onChangeProp(value);
  };

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
    <div className="flex flex-col gap-1 w-full">
      {label && <Label>{label}</Label>}
      <div
        className={classes(
          "flex duration-100 text-sm items-center select-none primary-panel-interactive w-full",
          "border-transparent",
          focused && "active",
          Boolean(disabled) ? "opacity-50 pointer-events-none" : "",
          className
        )}
      >
        {startingIcon}
        <input
          type={type}
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="px-2 py-[0.4rem] bg-transparent focus:outline-none w-full"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);

            if (type === "number" && (isNaN(+value) || +value < min))
              onChange(min.toString());
            if (type === "number" && +value > max) onChange(max.toString());
          }}
          autoFocus={autoFocus}
        />
        {endIcon}
      </div>
    </div>
  );
}
