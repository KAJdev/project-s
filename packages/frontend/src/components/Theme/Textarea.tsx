import { Label } from "./Label";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

export function Textarea({
  label,
  placeholder,
  value,
  className,
  onChange,
  autoFocus,
  disabled = false,
  ...props
}: Styleable &
  Omit<TextareaAutosizeProps, "onChange"> & {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
  }) {
  const [focused, setFocused] = useState(false);

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
        <TextareaAutosize
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="px-2 py-[0.4rem] bg-transparent focus:outline-none w-full resize-none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
