export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
