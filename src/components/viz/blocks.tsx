import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Mesh } from "three";
import { BLOCK_HEIGHT } from "@/constants";
import type { Step, VizType } from "@/types";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import {
  updateRects,
  type AnimationState,
  type GetBlockColor,
  getCurrentStep,
} from "@/lib/animation";

export const Blocks = ({
  path,
  getBlockColor,
  vizType,
}: {
  path: Step[];
  getBlockColor: GetBlockColor;
  vizType: VizType;
}) => {
  const rectRefs = useRef<(Mesh | null)[]>([]);

  const { scene } = useThree();
  const animationState = useRef<AnimationState>({
    lastHandledBlockIndex: -1,
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    const { currentStepIndex, currentStep } = getCurrentStep({ path, time });

    updateRects({
      vizType,
      rects: rectRefs.current,
      path,
      currentStepIndex,
      currentStep,
      getBlockColor,
      animationState: animationState.current,
      time,
      scene,
    });
  });

  return path.map((step, index) => (
    <mesh
      key={step.note.when}
      ref={(ref) => {
        rectRefs.current[index] = ref;
      }}
      position={[
        step.newDirection.x === step.directionOnHit.x
          ? step.x
          : getXOfStepInYAxis(
              { directionOnHit: step.directionOnHit, x: step.x },
              BLOCK_HEIGHT * 2
            ),
        step.newDirection.y === step.directionOnHit.y
          ? step.y
          : getYOfStepInXAxis(
              { directionOnHit: step.directionOnHit, y: step.y },
              BLOCK_HEIGHT * 2
            ),
        0,
      ]}
      scale={1}
      // opacity={vizType === "TUNNEL" ? 0 : 1}
      // shadowColor="white"
      // shadowBlur={0}
      // shadowOffset={{ x: 0, y: 0 }}
      // shadowOpacity={0}
    >
      <boxGeometry
        args={[
          BLOCK_HEIGHT, // TODO: switch to  vizType === "TUNNEL" ? 0 : BLOCK_HEIGHT
          BLOCK_HEIGHT,
          BLOCK_HEIGHT,
        ]}
      />
      <meshStandardMaterial
        // emissiveIntensity={BLOCK_HEIGHT}
        // emissive={getBlockColor({
        //   x: step.x,
        //   y: step.y,
        //   index,
        //   saturation: vizType === "TUNNEL" ? 100 : 0,
        // })}
        color={getBlockColor({
          x: step.x,
          y: step.y,
          index,
          saturation: vizType === "TUNNEL" ? 100 : 0,
        })}
      />
    </mesh>
  ));
};
