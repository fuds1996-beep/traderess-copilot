export default function ProgressBar({
  value,
  max = 100,
  color = "bg-pink-500",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div className="w-full bg-pink-100/50 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );
}
