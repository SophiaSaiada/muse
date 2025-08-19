import { calculateTunnelPoints } from "@/lib/tunnel";
import type { Step } from "@/types";
import { DoubleSide, Shape, Vector2 } from "three";

export const Tunnel = ({ path }: { path: Step[] }) => {
  const tunnelPoints = calculateTunnelPoints(path);
  const shape = new Shape(
    tunnelPoints.map((coord) => new Vector2(coord.x, coord.y))
  );

  return (
    <mesh>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={"#0a0a0a"} side={DoubleSide} />
    </mesh>
  );
};
