import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import { type Mesh } from "three";
import { CIRCLE_SIZE, CIRCLE_COLOR } from "@/constants";
import type { Step } from "@/types";
import {
  updateCameraPosition,
  updateCirclePosition,
  updateCircleScale,
} from "@/lib/animation";

const getTrailWidthFactor = ({
  threeD,
  isLandscape,
}: {
  threeD: boolean;
  isLandscape: boolean;
}) => {
  if (threeD) {
    if (isLandscape) {
      return 14;
    }
    return 8;
  }

  return 0.0175;
};

export const Ball = ({
  path,
  threeD,
  isLandscape,
}: {
  path: Step[];
  threeD: boolean;
  isLandscape: boolean;
}) => {
  const ballRef = useRef<Mesh>(null);
  const trailHeadRef = useRef<Mesh>(null!);

  const trailWidth = CIRCLE_SIZE * getTrailWidthFactor({ threeD, isLandscape });

  const { camera } = useThree();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentStepIndex = Math.max(
      path.findLastIndex(({ note: { when } }) => time >= when),
      0
    );

    const currentStep = path[currentStepIndex];
    const nextStep = path[currentStepIndex + 1];

    if (!ballRef.current) {
      return;
    }

    updateCirclePosition({
      circle: ballRef.current,
      trailHead: trailHeadRef.current,
      currentStep,
      nextStep,
      time,
    });

    updateCircleScale({
      currentStep,
      time,
      circle: ballRef.current,
    });

    updateCameraPosition({
      camera,
      circle: ballRef.current,
    });
  });

  return (
    <>
      <Trail
        width={trailWidth}
        length={1}
        color={CIRCLE_COLOR}
        attenuation={(t) => t * t}
        target={trailHeadRef}
      />

      <mesh ref={trailHeadRef} />

      <mesh ref={ballRef}>
        <sphereGeometry args={[CIRCLE_SIZE / 2]} />
        <meshStandardMaterial color={CIRCLE_COLOR} toneMapped />
      </mesh>
    </>
  );
};
