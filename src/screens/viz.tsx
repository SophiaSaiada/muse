import type { Step } from "@/types";
import { Footer } from "@/components/footer";
import { Viz } from "@/components/viz";

export const VizScreen = ({ path }: { path: Step[] }) => (
  <>
    <Viz path={path} />
    <Footer />
  </>
);
