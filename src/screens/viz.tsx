import type { Step } from "@/types";
import { Footer } from "@/components/footer";
import { Viz } from "@/components/viz";

export const VizScreen = ({
  path,
  imageData,
}: {
  path: Step[];
  imageData?: {
    rgbValues: { r: number; g: number; b: number; a: number }[];
    imageWidth: number;
    imageHeight: number;
    image: HTMLImageElement;
  };
}) => (
  <>
    <Viz path={path} imageData={imageData} />
    <Footer />
  </>
);
