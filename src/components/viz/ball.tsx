import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import {
  type OrthographicCamera,
  type PerspectiveCamera,
  type Mesh,
} from "three";
import { CIRCLE_SIZE, CIRCLE_COLOR } from "@/constants";
import type { Step } from "@/types";
import {
  updateCameraPosition,
  updateCirclePosition,
  updateCircleScale,
} from "@/lib/animation";

export const Ball = ({
  path,
  cameraRef,
}: {
  path: Step[];
  cameraRef: React.RefObject<(OrthographicCamera & PerspectiveCamera) | null>;
}) => {
  const ballRef = useRef<Mesh>(null);
  const trailHeadRef = useRef<Mesh>(null!);

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
      camera: cameraRef.current,
      circle: ballRef.current,
    });
  });

  return (
    <>
      <Trail
        width={CIRCLE_SIZE * 12}
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
