import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  colors: readonly string[];
  label: string;
};

export function ColorPicker({ value, onChange, colors, label }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "size-7 rounded-full border-2 transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
            value === color ? "border-foreground" : "border-transparent",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
