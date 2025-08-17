import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { OrthographicCamera, PerspectiveCamera, Mesh } from "three";
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
    <mesh ref={ballRef}>
      <sphereGeometry args={[CIRCLE_SIZE / 2, 32, 16]} />
      <meshStandardMaterial color={CIRCLE_COLOR} />
    </mesh>
  );
};
