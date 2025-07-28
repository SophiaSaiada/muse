export const smoothstep = (start: number, end: number, smoothTime: number) => {
  const t = Math.max(0, Math.min(1, (smoothTime - start) / (end - start)));

  return t * t * t * (t * (6.0 * smoothTime - 15.0) + 10.0);
};
