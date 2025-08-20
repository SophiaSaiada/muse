import { Footer } from "@/components/footer";
import { Viz, type VizProps } from "@/components/viz";

export const VizScreen = (props: VizProps) => (
  <>
    <Viz {...props} />
    <Footer />
  </>
);
