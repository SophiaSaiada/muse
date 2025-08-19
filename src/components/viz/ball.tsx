import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import { type Mesh, Color } from "three";
import { CIRCLE_SIZE, CIRCLE_COLOR } from "@/constants";
import type { Step } from "@/types";
import {
  getCurrentStepAndTime,
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
    const { time, currentStepIndex, currentStep, isAfterLastNote } =
      getCurrentStepAndTime({
        state,
        path,
      });

    if (!ballRef.current || isAfterLastNote) {
      return;
    }

    const nextStep = path[currentStepIndex + 1];

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
        color={new Color(CIRCLE_COLOR).multiplyScalar(1.5)}
        attenuation={(t) => t * t}
        target={trailHeadRef}
      />

      <mesh ref={trailHeadRef} />

      <mesh ref={ballRef}>
        <sphereGeometry args={[CIRCLE_SIZE / 2]} />
        <meshStandardMaterial
          color={new Color(CIRCLE_COLOR).multiplyScalar(4)}
          toneMapped={false}
        />
      </mesh>
    </>
  );
};
