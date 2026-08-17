/** Hex helpers used to derive hover / sidebar tokens from the deploy brand color. */

export function normalizeHex(hex: string, fallback = "#7c3c3f"): string {
  let value = hex.trim().replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
  return `#${value.toLowerCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mixHex(a: string, b: string, amount: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    from.r + (to.r - from.r) * t,
    from.g + (to.g - from.g) * t,
    from.b + (to.b - from.b) * t,
  );
}

export function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, "#000000", amount);
}

export function softHex(hex: string): string {
  return mixHex(hex, "#ffffff", 0.88);
}
