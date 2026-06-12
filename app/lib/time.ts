const STATIC_MIN = 15;
const STATIC_COUNT = 3;

function cumulativeMins(position: number, avgDuration: number): number {
  if (position < STATIC_COUNT) {
    return (position + 1) * STATIC_MIN;
  }
  return STATIC_COUNT * STATIC_MIN + (position - STATIC_COUNT + 1) * avgDuration;
}

export function formatEstTime(
  from: number | undefined,
  position: number,
  avgDuration: number
): string {
  const base = from ?? Date.now();
  const mins = cumulativeMins(position, avgDuration);
  const d = new Date(base + mins * 60 * 1000);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
