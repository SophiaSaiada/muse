import { useCallback } from "react";
import { Line, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
  THREE_D_LOCAL_STORAGE_KEY,
  DEFAULT_CAMERA_PROPS,
  CAMERA_Z_LANDSCAPE,
  CAMERA_Z_PORTRAIT,
  SHOW_PATH,
  SCALE,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { ImageData, Region, Step, VizType } from "@/types";
import { getBlockMappedColor } from "@/lib/image/color";
import { type GetBlockColor } from "@/lib/animation";
import { Ball } from "@/components/viz/ball";
import { Blocks } from "@/components/viz/blocks";
import { ZoomOutImage } from "@/components/viz/zoom-out-image";
import { Tunnel } from "@/components/tunnel";
import type { Textures } from "@/lib/texture";

export type VizProps = {
  path: Step[];
  imageData?: ImageData;
  denseRegion: Region | undefined;
  textures: Textures;
  ballColor: string;
  windowSize: { width: number; height: number };
};

export const Viz = ({
  path,
  imageData,
  denseRegion,
  textures,
  ballColor,
  windowSize,
}: VizProps) => {
  const [threeD] = useLocalStorage<boolean>(THREE_D_LOCAL_STORAGE_KEY);
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const isLandscape = windowSize.width > windowSize.height;

  const CameraComponent = threeD ? PerspectiveCamera : OrthographicCamera;

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
        "fixed inset-0 animate-fade-in duration-700 delay-300 opacity-0",
        vizType === "TUNNEL" && "bg-[#202020]"
      )}
    >
      <CameraComponent
        makeDefault
        {...DEFAULT_CAMERA_PROPS}
        position={[0, 0, isLandscape ? CAMERA_Z_LANDSCAPE : CAMERA_Z_PORTRAIT]}
      />

      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[0, 0, 0]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[0, 0, 0]} decay={0} intensity={Math.PI / 2} />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.1} radius={0.5} />
      </EffectComposer>

      {denseRegion && (
        <ZoomOutImage
          imageBitmap={imageData?.imageBitmap}
          denseRegion={denseRegion}
          path={path}
        />
      )}

      {vizType === "TUNNEL" && <Tunnel path={path} />}

      <Blocks path={path} getBlockColor={getBlockColor} vizType={vizType} />

      {SHOW_PATH && (
        <Line
          points={path.map((point) => [point.x, point.y, 0])}
          color={ballColor}
          dashSize={SCALE / 2}
          gapSize={SCALE * 3}
          opacity={0.5}
          transparent
          linewidth={SCALE / 2}
          dashed
        />
      )}

      <Ball
        path={path}
        threeD={threeD}
        isLandscape={isLandscape}
        textures={textures.ball}
        ballColor={ballColor}
      />
    </Canvas>
  );
};
