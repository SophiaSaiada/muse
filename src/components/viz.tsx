import { Layer, Stage, Circle, Path, Rect, Image } from "react-konva";
import { useCallback, useEffect, useRef } from "react";
import Konva from "konva";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useWindowSize } from "react-use";
import {
  SCALE,
  SHOW_PATH,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
  CIRCLE_COLOR,
  BLOCK_HEIGHT,
  DEBUG_SONG_END,
} from "@/constants";
import { Tunnel } from "@/components/tunnel";
import { cn } from "@/lib/utils";
import type { ImageData, Region, Step, VizType } from "@/types";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { getBlockMappedColor } from "@/lib/image/color";
import {
  handleAnimation,
  type AnimationState,
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
  const { width, height } = useWindowSize();

  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const stageRef = useRef<Konva.Stage>(null);
  const rectRefs = useRef<(Konva.Rect | null)[]>([]);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<Konva.Image>(null);

  const circleRef = useRef<Konva.Circle>(null);
  const nearPartOfTrailRef = useRef<Konva.Circle>(null);
  const farPartOfTrailRef = useRef<Konva.Circle>(null);

  const actualWidth = denseRegion?.endX
    ? denseRegion.endX - denseRegion.startX
    : 0;
  const actualHeight = denseRegion?.endY
    ? denseRegion.endY - denseRegion.startY
    : 0;

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

  useEffect(() => {
    const lastNoteTime = Math.max(...path.map(({ note: { when } }) => when));

    const animationState: AnimationState = {
      lastHandledBlockIndex: -1,
    };

    const animation = new Konva.Animation((frame) => {
      handleAnimation({
        time:
          (frame?.time ?? 0) / 1000 + (DEBUG_SONG_END ? lastNoteTime - 1 : 0),
        lastNoteTime,
        denseRegion,
        imageData,
        path,
        vizType,
        getBlockColor,
        animationState,
        konvaObjects: {
          layer: layerRef.current,
          stage: stageRef.current,
          image: imageRef.current,
          nearPartOfTrail: nearPartOfTrailRef.current,
          farPartOfTrail: farPartOfTrailRef.current,
          circle: circleRef.current,
          rects: rectRefs.current,
        },
      });
    }, layerRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [denseRegion, getBlockColor, imageData, path, vizType]);

  return (
    <Stage
      className={cn(
        "fixed inset-0 animate-fade-in",
        vizType === "TUNNEL" && "bg-[#202020]"
      )}
      width={width}
      height={height}
      ref={stageRef}
    >
      <Layer ref={layerRef} x={width / 2} y={height / 2}>
        <Image
          ref={imageRef}
          image={imageData?.image}
          width={actualWidth}
          height={actualHeight}
          x={denseRegion?.startX}
          y={denseRegion?.startY}
          opacity={0}
        />

        {vizType === "TUNNEL" && <Tunnel path={path} />}

        {path.map((step, index) => (
          <Rect
            key={step.note.when}
            ref={(ref) => {
              rectRefs.current[index] = ref;
            }}
            x={
              step.newDirection.x === step.directionOnHit.x
                ? step.x
                : getXOfStepInYAxis(
                    { directionOnHit: step.directionOnHit, x: step.x },
                    BLOCK_HEIGHT * 2
                  )
            }
            y={
              step.newDirection.y === step.directionOnHit.y
                ? step.y
                : getYOfStepInXAxis(
                    { directionOnHit: step.directionOnHit, y: step.y },
                    BLOCK_HEIGHT * 2
                  )
            }
            width={vizType === "TUNNEL" ? 0 : BLOCK_HEIGHT}
            height={vizType === "TUNNEL" ? 0 : BLOCK_HEIGHT}
            offsetX={(vizType === "TUNNEL" ? 0 : BLOCK_HEIGHT) / 2}
            offsetY={vizType === "TUNNEL" ? 0 : BLOCK_HEIGHT / 2}
            opacity={vizType === "TUNNEL" ? 0 : 1}
            shadowColor="white"
            shadowBlur={0}
            shadowOffset={{ x: 0, y: 0 }}
            shadowOpacity={0}
            fill={getBlockColor({
              x: step.x,
              y: step.y,
              index,
              saturation: vizType === "TUNNEL" ? 100 : 0,
            })}
          />
        ))}
        {SHOW_PATH && (
          <Path
            data={"M 0 0 " + path.map(({ x, y }) => `L ${x} ${y}`).join(" ")}
            stroke={CIRCLE_COLOR}
            opacity={0.75}
            strokeWidth={1}
          />
        )}

        <Circle
          ref={farPartOfTrailRef}
          width={SCALE}
          height={SCALE}
          x={0}
          y={0}
          fill={CIRCLE_COLOR}
          opacity={0.33}
          shadowColor={CIRCLE_COLOR}
          shadowBlur={SCALE / 2}
          shadowOffset={{ x: 0, y: 0 }}
          shadowOpacity={1}
        />

        <Circle
          ref={nearPartOfTrailRef}
          x={0}
          y={0}
          width={SCALE}
          height={SCALE}
          fill={CIRCLE_COLOR}
          opacity={0.66}
          shadowColor={CIRCLE_COLOR}
          shadowBlur={SCALE / 2}
          shadowOffset={{ x: 0, y: 0 }}
          shadowOpacity={1}
        />

        <Circle
          x={0}
          y={0}
          ref={circleRef}
          width={SCALE}
          height={SCALE}
          fill={CIRCLE_COLOR}
          shadowColor={CIRCLE_COLOR}
          shadowBlur={SCALE / 2}
          shadowOffset={{ x: 0, y: 0 }}
          shadowOpacity={1}
        />
      </Layer>
    </Stage>
  );
};
