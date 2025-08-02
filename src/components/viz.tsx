import { Layer, Stage, Circle, Path } from "react-konva";
import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { useLocalStorage, useWindowSize } from "react-use";
import {
  SCALE,
  SHOW_PATH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  MAX_BLOCKS,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
  CIRCLE_COLOR,
} from "@/constants";
import { Tunnel } from "@/components/tunnel";
import { Block } from "@/components/block";
import { smoothstep } from "@/lib/smoothstep";
import { cn } from "@/lib/utils";
import type { Step, VizType } from "@/types";

// TODO: restart when song restarts
export const Viz = ({ path }: { path: Step[] }) => {
  const { width, height } = useWindowSize();

  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const circleRef = useRef<Konva.Circle>(null);
  const nearPartOfTrailRef = useRef<Konva.Circle>(null);
  const farPartOfTrailRef = useRef<Konva.Circle>(null);

  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);

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

      setCurrentNoteIndex(nextStepIndex - 1);

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
    }, layerRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [path]);

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

        {path
          .slice(
            Math.max(0, currentNoteIndex - MAX_BLOCKS),
            currentNoteIndex + (vizType === "TUNNEL" ? 1 : MAX_BLOCKS)
          )
          .map((step, index) => (
            <Block
              key={step.note.when}
              step={step}
              index={index + Math.max(0, currentNoteIndex - MAX_BLOCKS)}
              currentNoteIndex={currentNoteIndex}
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
