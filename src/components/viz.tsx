import { Layer, Stage, Circle, Path, Rect, Image } from "react-konva";
import { useCallback, useEffect, useRef } from "react";
import Konva from "konva";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useWindowSize } from "react-use";
import { range } from "es-toolkit";
import {
  SCALE,
  SHOW_PATH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
  CIRCLE_COLOR,
  BLOCK_HEIGHT,
  BLOCK_START_HUE,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_WIDTH,
  STAR_COLOR_CHANGE_MAX_DURATION,
  ZOOM_OUT_PADDING_FACTOR,
} from "@/constants";
import { Tunnel } from "@/components/tunnel";
import { smoothstep } from "@/lib/smoothstep";
import { cn, lerp } from "@/lib/utils";
import type { ImageData, Region, Step, VizType } from "@/types";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";

type GetBlockColor = (params: {
  x: number;
  y: number;
  index: number;
  saturation: number;
}) => string;

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
    }) => {
      if (!denseRegion) {
        return `hsl(${
          Math.round(
            (index /
              (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
                ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
                : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
              360 +
              BLOCK_START_HUE
          ) % 360
        }, ${saturation}%, 60%)`;
      }

      if (!imageData) {
        return "black";
      }

      const mappedX =
        ((x - (denseRegion?.startX ?? 0)) / actualWidth) * imageData.imageWidth;
      const mappedY =
        ((y - (denseRegion?.startY ?? 0)) / actualHeight) *
        imageData.imageHeight;

      const mappedIndex =
        Math.floor(mappedX) + Math.floor(mappedY) * imageData.imageWidth;

      const rgba = imageData.rgbaValues[mappedIndex];
      if (!rgba || rgba.a === 0) {
        return "hsl(0,0%,60%)";
      }

      return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`; // TODO: take only hue
    },
    [actualHeight, actualWidth, denseRegion, imageData]
  );

  useEffect(() => {
    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;

      if (!stageRef.current) {
        return;
      }

      const nextStepIndex = path.findIndex(({ note: { when } }) => time < when);
      if (nextStepIndex <= 0) {
        if (vizType === "STARS") {
          zoomOut(layerRef.current, path, stageRef.current, imageRef.current);
        }

        return;
      }

      const width = stageRef.current.width();
      const height = stageRef.current.height();

      const nextStep = path[nextStepIndex];
      const currentStep = path[nextStepIndex - 1];

      updateTrailPosition({
        nearPartOfTrail: nearPartOfTrailRef.current,
        farPartOfTrail: farPartOfTrailRef.current,
        circle: circleRef.current,
      });

      updateCirclePosition({
        currentStep,
        nextStep,
        time,
        circle: circleRef.current,
      });

      updateCameraPosition({
        layer: layerRef.current,
        width,
        height,
        circle: circleRef.current,
      });

      updateCircleScale({
        currentStep,
        time,
        circle: circleRef.current,
      });

      updateRects({
        vizType,
        rects: rectRefs.current,
        path,
        nextStepIndex,
        currentStep,
        time,
        getBlockColor,
      });
    }, layerRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [getBlockColor, path, vizType]);

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
            width={vizType === "TUNNEL" ? height : BLOCK_HEIGHT}
            height={vizType === "TUNNEL" ? width : BLOCK_HEIGHT}
            offsetX={(vizType === "TUNNEL" ? height : BLOCK_HEIGHT) / 2}
            offsetY={vizType === "TUNNEL" ? width : BLOCK_HEIGHT / 2}
            opacity={vizType === "TUNNEL" ? 0 : 1}
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
        />

        <Circle
          ref={nearPartOfTrailRef}
          x={0}
          y={0}
          width={SCALE}
          height={SCALE}
          fill={CIRCLE_COLOR}
          opacity={0.66}
        />

        <Circle
          x={0}
          y={0}
          ref={circleRef}
          width={SCALE}
          height={SCALE}
          fill={CIRCLE_COLOR}
        />
      </Layer>
    </Stage>
  );
};

const updateRects = ({
  vizType,
  rects,
  path,
  nextStepIndex,
  currentStep,
  time,
  getBlockColor,
}: {
  vizType: string | undefined;
  rects: (Konva.Rect | null)[] | null;
  path: Step[];
  nextStepIndex: number;
  currentStep: Step;
  time: number;
  getBlockColor: GetBlockColor;
}) => {
  // TODO: re-implement tunnel animation
  if (vizType !== "STARS") {
    return;
  }
  const rect = rects?.[nextStepIndex - 1];
  if (!rect) {
    return;
  }

  if (rect.width() === BLOCK_WIDTH || rect.height() === BLOCK_WIDTH) {
    return;
  }

  const height =
    currentStep.newDirection.x === currentStep.directionOnHit.x
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;
  const width =
    currentStep.newDirection.y === currentStep.directionOnHit.y
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;

  const timeOffset = currentStep?.note.when ?? 0;
  const animationDuration =
    Math.min(currentStep.duration, STAR_COLOR_CHANGE_MAX_DURATION) + timeOffset;

  rect.fill(
    getBlockColor({
      x: currentStep.x,
      y: currentStep.y,
      index: nextStepIndex - 1,
      saturation: lerp({
        start: 0,
        end: 100,
        time: time,
        duration: animationDuration,
        timeOffset,
      }),
    })
  );
  const newWidth = lerp({
    start: BLOCK_HEIGHT,
    end: width,
    time: time,
    duration: animationDuration,
    timeOffset,
  });
  const newHeight = lerp({
    start: BLOCK_HEIGHT,
    end: height,
    time: time,
    duration: animationDuration,
    timeOffset,
  });
  rect.offsetX(newWidth / 2);
  rect.offsetY(newHeight / 2);
  rect.width(newWidth);
  rect.height(newHeight);

  range(0, nextStepIndex - 1).forEach((index) => {
    if (index < 0) {
      return;
    }

    const rect = rects?.[index];
    if (!rect) {
      return;
    }
    const height =
      path[index].newDirection.x === path[index].directionOnHit.x
        ? BLOCK_HEIGHT
        : BLOCK_WIDTH;
    const width =
      path[index].newDirection.y === path[index].directionOnHit.y
        ? BLOCK_HEIGHT
        : BLOCK_WIDTH;
    rect.fill(
      getBlockColor({
        x: path[index].x,
        y: path[index].y,
        index,
        saturation: 100,
      })
    );
    rect.offsetX(width / 2);
    rect.offsetY(height / 2);
    rect.width(width);
    rect.height(height);
  });
};

const zoomOut = (
  layer: Konva.Layer | null,
  path: Step[],
  stage: Konva.Stage,
  imageRef: Konva.Image | null
) => {
  if (!layer) {
    return;
  }

  const currentScaleX = layer.scaleX();

  const actualWidth =
    Math.max(...path.map(({ y }) => y)) - Math.min(...path.map(({ y }) => y));
  const actualHeight =
    Math.max(...path.map(({ x }) => x)) - Math.min(...path.map(({ x }) => x));

  const desiredScale = Math.min(
    // TODO: handle small songs
    stage.height() /
      (actualHeight + stage.height() * ZOOM_OUT_PADDING_FACTOR * 2),
    stage.width() / (actualWidth + stage.width() * ZOOM_OUT_PADDING_FACTOR * 2)
  );

  if (Math.abs(desiredScale - layer.scaleX()) < 0.001) {
    if (imageRef) {
      imageRef.opacity(
        imageRef.opacity() +
          (0.125 - imageRef.opacity()) *
            smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING)
      );
    }

    return;
  }

  const newScale =
    currentScaleX +
    (desiredScale - currentScaleX) * smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING);

  layer.scale({ x: newScale, y: newScale });

  layer.position({
    x:
      layer.x() +
      (stage.width() / 2 - layer.x()) *
        smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING),
    y:
      layer.y() +
      (stage.height() / 2 - layer.y()) *
        smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING),
  });
};

function getCircleScale({
  currentStep,
  time,
}: {
  currentStep: Step;
  time: number;
}) {
  const nextNoteTime = currentStep.note.when;
  const currentNoteTime = currentStep.note.when;
  if (
    nextNoteTime - BOUNCE_ANIMATION_HALF_TIME <= time &&
    time <= nextNoteTime
  ) {
    return (
      1 -
      ((time - (nextNoteTime - BOUNCE_ANIMATION_HALF_TIME)) /
        BOUNCE_ANIMATION_HALF_TIME) *
        (1 - BOUNCE_ANIMATION_SCALE_FACTOR)
    );
  }
  if (
    currentNoteTime <= time &&
    time <= currentNoteTime + BOUNCE_ANIMATION_HALF_TIME
  ) {
    return (
      BOUNCE_ANIMATION_SCALE_FACTOR +
      ((time - currentNoteTime) / BOUNCE_ANIMATION_HALF_TIME) *
        (1 - BOUNCE_ANIMATION_SCALE_FACTOR)
    );
  }
  return 1;
}
function updateCircleScale({
  currentStep,
  time,
  circle,
}: {
  currentStep: Step;
  time: number;
  circle: Konva.Circle | null;
}) {
  const scale = getCircleScale({ currentStep, time });
  circle?.scale({ x: scale, y: scale });
}

function updateTrailPosition({
  nearPartOfTrail,
  farPartOfTrail,
  circle,
}: {
  nearPartOfTrail: Konva.Circle | null;
  farPartOfTrail: Konva.Circle | null;
  circle: Konva.Circle | null;
}) {
  farPartOfTrail?.x(nearPartOfTrail?.x());
  farPartOfTrail?.y(nearPartOfTrail?.y());

  nearPartOfTrail?.x(circle?.x());
  nearPartOfTrail?.y(circle?.y());
}

function updateCirclePosition({
  currentStep,
  nextStep,
  time,
  circle,
}: {
  currentStep: Step;
  nextStep: Step;
  time: number;
  circle: Konva.Circle | null;
}) {
  const offset =
    (time - currentStep.note.when) /
    (currentStep.note.when - nextStep.note.when);

  const x = currentStep.x + (currentStep.x - nextStep.x) * offset;
  const y = currentStep.y + (currentStep.y - nextStep.y) * offset;

  circle?.x(x);
  circle?.y(y);
}

function updateCameraPosition({
  layer,
  circle,
  width,
  height,
}: {
  layer: Konva.Layer | null;
  circle: Konva.Circle | null;
  width: number;
  height: number;
}) {
  const containerXCenter = width / 2;
  const containerYCenter = height / 2;

  if (!layer || !circle) {
    return;
  }

  const desiredX = containerXCenter - circle.x();
  const desiredY = containerYCenter - circle.y();

  const currentX = layer.x();
  const currentY = layer.y();

  const newX =
    currentX +
    (desiredX - currentX) * smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING);
  const newY =
    currentY +
    (desiredY - currentY) * smoothstep(0, 1, CAMERA_FOLLOW_SMOOTHING);

  layer.x(newX);
  layer.y(newY);
}
