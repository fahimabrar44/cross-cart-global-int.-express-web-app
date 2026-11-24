/**
 * Escape user input before embedding it in a MongoDB `$regex`.
 *
 * Without this, a search like `a+b(` throws an invalid-regex error (500) and
 * crafted patterns can cause expensive backtracking.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive "exact match" regex for a trimmed value. */
export function exactMatchRegex(value: string): RegExp {
  return new RegExp(`^${escapeRegex(value.trim())}$`, "i");
}
