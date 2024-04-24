import ReactSlider from "react-slider";

export function Slider({
  min,
  max,
  value,
  onChange,
  className,
  disabled,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <ReactSlider
      className={classes("w-full my-4", disabled && "opacity-20", className)}
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      onChange={onChange}
      snapDragDisabled={false}
      renderThumb={(props, state) => (
        <div {...props} className="focus:outline-none group">
          <div
            className="bg-[#747983] group-active:bg-[#c4c5c7] hover:bg-[#c4c5c7] w-4 h-4"
            style={{
              boxShadow: "0 0 0 4px #0d151f",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      )}
      renderTrack={(props, state) => (
        <div {...props} className="h-4">
          <div className="h-[2px] bg-white/30 w-full" />
        </div>
      )}
      renderMark={(props) => (
        <div
          {...props}
          className="h-4 bg-white rounded-full"
          style={{ width: "2px" }}
        />
      )}
    />
  );
}
