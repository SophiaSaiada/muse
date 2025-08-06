import type { Region, Step } from "@/types";
import { Footer } from "@/components/footer";
import { Viz } from "@/components/viz";

export const VizScreen = ({
  path,
  imageData,
  denseRegion,
}: {
  path: Step[];
  imageData?: {
    rgbValues: { r: number; g: number; b: number; a: number }[];
    imageWidth: number;
    imageHeight: number;
    image: HTMLImageElement;
  };
  denseRegion: Region | undefined;
}) => (
  <>
    <Viz path={path} imageData={imageData} denseRegion={denseRegion} />
    <Footer />
  </>
);
