import {
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_START_HUE,
} from "@/constants";
import type { ImageData, Region } from "@/types";

const DEFAULT_LIGHTNESS = 60;
const BLUE_HUE_LIGHTNESS_ADDITION = 10;

const hslToString = ({ h, s, l }: { h: number; s: number; l: number }) =>
  `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;

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
    return hslToString({ h: 0, s: 0, l: DEFAULT_LIGHTNESS });
  }

  return hslToString({
    h: hsl.h,
    s: Math.min(saturation, Math.max(hsl.s, 0.5)) * 100,
    l: Math.max(hsl.l, 0.4) * 100,
  });
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

const BLUE_HUE_START = 215;
const BLUE_HUE_END = 295;

const BLUE_HUE_PEAK = (BLUE_HUE_START + BLUE_HUE_END) / 2;
const BLUE_HUE_DISTANCE_FROM_PEAK = (BLUE_HUE_END - BLUE_HUE_START) / 2;

const getBlockColorByIndex = ({
  index,
  saturation,
}: {
  index: number;
  saturation: number;
}) => {
  const h =
    ((index /
      (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
        ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
        : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
      360 +
      BLOCK_START_HUE) %
    360;

  const l =
    DEFAULT_LIGHTNESS +
    ((BLUE_HUE_DISTANCE_FROM_PEAK -
      Math.min(Math.abs(h - BLUE_HUE_PEAK), BLUE_HUE_DISTANCE_FROM_PEAK)) /
      BLUE_HUE_DISTANCE_FROM_PEAK) *
      BLUE_HUE_LIGHTNESS_ADDITION;

  return hslToString({ h, s: saturation, l });
};
