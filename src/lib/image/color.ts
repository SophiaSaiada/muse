import type { ImageData, Region } from "@/types";

export const getBlockMappedColor = ({
  imageData,
  x,
  y,
  denseRegion,
  saturation,
}: {
  imageData: ImageData;
  x: number;
  y: number;
  denseRegion: Region;
  saturation: number;
}) => {
  const actualWidth = denseRegion?.endX
    ? denseRegion.endX - denseRegion.startX
    : 0;
  const actualHeight = denseRegion?.endY
    ? denseRegion.endY - denseRegion.startY
    : 0;

  const mappedX =
    ((x - (denseRegion?.startX ?? 0)) / actualWidth) * imageData.imageWidth;
  const mappedY =
    ((y - (denseRegion?.startY ?? 0)) / actualHeight) * imageData.imageHeight;

  const mappedIndex =
    Math.floor(mappedX) + Math.floor(mappedY) * imageData.imageWidth;

  const rgba = imageData.rgbaValues[mappedIndex];
  const hsl = rgba && rgbToHsl(rgba);
  if (!rgba || rgba.a === 0 || hsl.s < 0.3 || hsl.l < 0.3) {
    return "hsl(0,0%,60%)";
  }

  return `hsl(${hsl.h}, ${Math.min(saturation, Math.max(hsl.s, 0.5)) * 100}%, ${
    Math.max(hsl.l, 0.4) * 100
  }%)`;
};

const rgbToHsl = ({
  r: rawR,
  g: rawG,
  b: rawB,
}: {
  r: number;
  g: number;
  b: number;
}) => {
  const r = rawR / 255;
  const g = rawG / 255;
  const b = rawB / 255;

  const maxValue = Math.max(r, g, b);
  const minValue = Math.min(r, g, b);

  const difference = maxValue - minValue;
  const hue =
    difference === 0
      ? 0
      : maxValue === r
      ? ((g - b) / difference) % 6
      : maxValue === g
      ? (b - r) / difference + 2
      : (r - g) / difference + 4;

  const lightness = (minValue + maxValue) / 2;

  const saturation =
    difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1));

  return { h: hue * 60, s: saturation, l: lightness };
};
