import {
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_START_HUE,
} from "@/constants";
import type { ImageData, Region } from "@/types";

export const getBlockMappedColor = ({
  imageData,
  index,
  x,
  y,
  denseRegion,
  saturation,
}: {
  imageData: ImageData | undefined;
  index: number;
  x: number;
  y: number;
  denseRegion: Region | undefined;
  saturation: number;
}) => {
  if (!denseRegion || !imageData) {
    return getBlockColorByIndex({ index, saturation });
  }

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

  return `hsl(${Math.round(hsl.h)}, ${Math.round(
    Math.min(saturation, Math.max(hsl.s, 0.5)) * 100
  )}%, ${Math.round(Math.max(hsl.l, 0.4) * 100)}%)`;
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

  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness };
};

const getBlockColorByIndex = ({
  index,
  saturation,
}: {
  index: number;
  saturation: number;
}) =>
  `hsl(${
    Math.round(
      (index /
        (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
        360 +
        BLOCK_START_HUE
    ) % 360
  }, ${saturation}%, 60%)`;
