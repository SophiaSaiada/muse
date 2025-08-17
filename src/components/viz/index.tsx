import { useCallback, useRef } from "react";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  CIRCLE_SIZE,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
  CIRCLE_COLOR,
  BLOCK_HEIGHT,
  THREE_D_LOCAL_STORAGE_KEY,
  DEFAULT_CAMERA_PROPS,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { ImageData, Region, Step, VizType } from "@/types";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { getBlockMappedColor } from "@/lib/image/color";
import {
  updateCameraPosition,
  updateCirclePosition,
  updateCircleScale,
  updateRects,
  type GetBlockColor,
} from "@/lib/animation";

export const Viz = ({
  path,
  imageData,
  denseRegion,
}: {
  path: Step[];
  imageData?: ImageData;
  denseRegion: Region | undefined;
}) => {
  const [threeD] = useLocalStorage<boolean>(THREE_D_LOCAL_STORAGE_KEY);
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const CameraComponent = threeD ? PerspectiveCamera : OrthographicCamera;

  const cameraRef = useRef<
    (THREE.OrthographicCamera & THREE.PerspectiveCamera) | null
  >(null);

  const getBlockColor: GetBlockColor = useCallback(
    ({
      x,
      y,
      index,
      saturation,
    }: {
      x: number;
      y: number;
      index: number;
      saturation: number;
    }) =>
      getBlockMappedColor({
        imageData,
        index,
        x,
        y,
        denseRegion,
        saturation,
      }),
    [denseRegion, imageData]
  );

  return (
    <Canvas
      style={{
        width: "100vw",
        height: "100vh",
      }}
      className={cn(
        "fixed inset-0 animate-fade-in",
        vizType === "TUNNEL" && "bg-[#202020]"
      )}
    >
      <CameraComponent makeDefault ref={cameraRef} {...DEFAULT_CAMERA_PROPS} />

      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[0, 0, 0]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[0, 0, 0]} decay={0} intensity={Math.PI / 2} />

      {/* <Image
        ref={imageRef}
        image={imageData?.image}
        width={actualWidth}
        height={actualHeight}
        x={denseRegion?.startX}
        y={denseRegion?.startY}
        opacity={0}
      /> */}

      <Blocks path={path} getBlockColor={getBlockColor} vizType={vizType} />

      {/* {SHOW_PATH && (
        <Path
          data={"M 0 0 " + path.map(({ x, y }) => `L ${x} ${y}`).join(" ")}
          stroke={CIRCLE_COLOR}
          opacity={0.75}
          strokeWidth={1}
        />
      )} */}

      <Ball path={path} cameraRef={cameraRef} />
    </Canvas>
  );
};

const Ball = ({
  path,
  cameraRef,
}: {
  path: Step[];
  cameraRef: React.RefObject<
    (THREE.OrthographicCamera & THREE.PerspectiveCamera) | null
  >;
}) => {
  const ballRef = useRef<THREE.Mesh>(null);

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

const Blocks = ({
  path,
  getBlockColor,
  vizType,
}: {
  path: Step[];
  getBlockColor: GetBlockColor;
  vizType: VizType;
}) => {
  const rectRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentStepIndex = Math.max(
      path.findLastIndex(({ note: { when } }) => time >= when),
      0
    );
    const currentStep = path[currentStepIndex];

    updateRects({
      vizType,
      rects: rectRefs.current,
      path,
      currentStepIndex,
      currentStep,
      getBlockColor,
      animationState: { lastHandledBlockIndex: -1 },
      time,
      layer: null,
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
