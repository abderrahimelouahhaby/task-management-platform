type LabelChipProps = {
  name: string;
  color: string;
};

export function LabelChip({ name, color }: LabelChipProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
