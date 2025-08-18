import { useMemo, useRef } from "react";
import { getCurrentStepAndTime, zoomOut } from "@/lib/animation";
import type { Region, Step } from "@/types";
import { useFrame, useThree } from "@react-three/fiber";
import { type Mesh, type MeshBasicMaterial } from "three";
import { Texture } from "three";

export const ZoomOutImage = ({
  imageBitmap,
  denseRegion,
  path,
}: {
  imageBitmap: ImageBitmap | undefined;
  denseRegion: Region;
  path: Step[];
}) => {
  const lastNoteTime = Math.max(...path.map(({ note: { when } }) => when));

  const { startX, startY, endX, endY } = denseRegion;
  const actualWidth = endX - startX;
  const actualHeight = endY - startY;

  const { camera, size } = useThree();
  const imageRef = useRef<Mesh>(null);

  const imageTexture = useMemo(() => {
    if (!imageBitmap) {
      return undefined;
    }

    const texture = new Texture(imageBitmap);
    texture.needsUpdate = true;
    return texture;
  }, [imageBitmap]);

  useFrame((state) => {
    const { time } = getCurrentStepAndTime({
      state,
      path,
    });

    if (time > lastNoteTime) {
      zoomOut(
        camera,
        denseRegion,
        size,
        imageRef.current?.material as MeshBasicMaterial | null | undefined
      );
    }
  });

  if (!imageTexture) {
    return null;
  }

  return (
    <mesh
      position={[(endX + startX) / 2, (endY + startY) / 2, 0]}
      scale={[1, -1, 1]}
      ref={imageRef}
    >
      <planeGeometry args={[actualWidth, actualHeight]} />
      <meshBasicMaterial map={imageTexture} opacity={0} transparent />
    </mesh>
  );
};
