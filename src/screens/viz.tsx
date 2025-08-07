import type { ImageData, Region, Step } from "@/types";
import { Footer } from "@/components/footer";
import { Viz } from "@/components/viz";

export const VizScreen = ({
  path,
  imageData,
  denseRegion,
}: {
  path: Step[];
  imageData?: ImageData;
  denseRegion: Region | undefined;
}) => (
  <>
    <Viz path={path} imageData={imageData} denseRegion={denseRegion} />
    <Footer />
  </>
);
