export const smoothstep = (start: number, end: number, smoothTime: number) => {
  const factor =
    smoothTime *
    smoothTime *
    smoothTime *
    (smoothTime * (6.0 * smoothTime - 15.0) + 10.0);
  return start + (end - start) * factor;
};
