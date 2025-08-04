import { Layer, Stage, Circle, Path, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { useLocalStorage, useWindowSize } from "react-use";
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
} from "@/constants";
import { Tunnel } from "@/components/tunnel";
import { smoothstep } from "@/lib/smoothstep";
import { cn, lerp } from "@/lib/utils";
import type { Step, VizType } from "@/types";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { range } from "es-toolkit";

// TODO: restart when song restarts
export const Viz = ({ path }: { path: Step[] }) => {
  const { width, height } = useWindowSize();

  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const stageRef = useRef<Konva.Stage>(null);
  const rectRefs = useRef<(Konva.Rect | null)[]>([]);
  const layerRef = useRef<Konva.Layer>(null);

  const circleRef = useRef<Konva.Circle>(null);
  const nearPartOfTrailRef = useRef<Konva.Circle>(null);
  const farPartOfTrailRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;

      const nextStepIndex = path.findIndex(({ note: { when } }) => time < when);
      if (nextStepIndex <= 0 || !stageRef.current) {
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
      });
    }, layerRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [path, vizType]);

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
            fill={`hsl(${
              Math.round(
                (index /
                  (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
                    ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
                    : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
                  360 +
                  BLOCK_START_HUE
              ) % 360
            }, ${vizType === "TUNNEL" ? 100 : 0}%, 60%)`}
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
}: {
  vizType: string | undefined;
  rects: (Konva.Rect | null)[] | null;
  path: Step[];
  nextStepIndex: number;
  currentStep: Step;
  time: number;
}) => {
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

  const hue =
    Math.round(
      ((nextStepIndex - 1) /
        (nextStepIndex - 1 < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
        360 +
        BLOCK_START_HUE
    ) % 360;

  const timeOffset = currentStep?.note.when ?? 0;
  const animationDuration =
    Math.min(currentStep.duration, STAR_COLOR_CHANGE_MAX_DURATION) + timeOffset;

  rect.fill(
    `hsl(${hue}, ${lerp({
      start: 0,
      end: 100,
      time: time,
      duration: animationDuration,
      timeOffset,
    })}%, 60%)`
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

  range(nextStepIndex - 1 - 2, nextStepIndex - 1).forEach((index) => {
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
    const hue =
      Math.round(
        (index /
          (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
            ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
            : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
          360 +
          BLOCK_START_HUE
      ) % 360;
    rect.fill(`hsl(${hue}, 100%, 60%)`);
    rect.offsetX(width / 2);
    rect.offsetY(height / 2);
    rect.width(width);
    rect.height(height);
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
