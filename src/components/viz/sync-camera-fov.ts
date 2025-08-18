import { useThree } from "@react-three/fiber";
import { useWindowSize } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { MathUtils } from "three";
import { DEFAULT_CAMERA_PROPS } from "@/constants";

export const SyncCameraFov = () => {
  const { width, height } = useWindowSize();
  const { camera } = useThree();

  useEffect(() => {
    if (!width || !height || !("fov" in camera)) return;

    const aspectRatio = width / height;
    const fov = DEFAULT_CAMERA_PROPS.fov;
    const planeAspectRatio = 16 / 9;

    if (aspectRatio > planeAspectRatio) {
      const cameraHeight = Math.tan(MathUtils.degToRad(fov / 2));
      const ratio = aspectRatio / planeAspectRatio;
      const newCameraHeight = cameraHeight / ratio;

      camera.fov = MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
    } else {
      camera.fov = fov;
    }
  }, [width, height, camera]);

  return null;
};
