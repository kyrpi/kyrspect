export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends Record<string, unknown>>(base: T, override?: Record<string, unknown>): T {
  if (!override) return { ...base };
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = next[key];
    if (isRecord(current) && isRecord(value)) {
      next[key] = deepMerge(current, value);
    } else if (value !== undefined) {
      next[key] = value;
    }
  }
  return next as T;
}
