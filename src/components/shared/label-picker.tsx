import { cn } from "@/lib/utils";

type PickerLabel = { id: string; name: string; color: string };

type LabelPickerProps = {
  labels: PickerLabel[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function LabelPicker({ labels, value, onChange }: LabelPickerProps) {
  if (labels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No labels yet. Owners and admins can create them in Settings.
      </p>
    );
  }

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Labels">
      {labels.map((label) => {
        const selected = value.includes(label.id);

        return (
          <button
            key={label.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(label.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: label.color }}
              aria-hidden="true"
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
}
