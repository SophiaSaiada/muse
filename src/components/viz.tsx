import { Layer, Rect, Stage, Group, Circle, Path } from "react-konva";
import { type Step } from "../lib/path";
import { useEffect, useRef } from "react";
import Konva from "konva";
import { useWindowSize } from "react-use";
import {
  SCALE,
  SHOW_PATH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  SHOW_BLOCKS,
} from "../constants";
import { calculateTunnelPoints } from "../lib/tunnel";

export const Viz = ({ path }: { path: Step[] }) => {
  const { width, height } = useWindowSize();

  const layerRef = useRef<Konva.Group>(null);

  const circleGroupRef = useRef<Konva.Group>(null);

  const nearPartOfTrailRef = useRef<Konva.Circle>(null);
  const farPartOfTrailRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;

      const nextStepIndex = path.findIndex(({ note: { when } }) => time < when);
      if (nextStepIndex <= 0) {
        return;
      }

      const nextStep = path[nextStepIndex];
      const currentStep = path[nextStepIndex - 1];

      updateObstaclesLayerPosition({
        currentStep,
        nextStep,
        time,
        layer: layerRef.current,
        width,
        height,
      });

      updateTrailPosition({
        nearPartOfTrail: nearPartOfTrailRef.current,
        farPartOfTrail: farPartOfTrailRef.current,
        nextStep,
      });

      updateCircleScale({
        currentStep,
        time,
        circleGroup: circleGroupRef.current,
      });
    }, layerRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [height, path, width]);

  // TODO: render only visible rectangles

  return (
    <Stage width={width} height={height} style={{ backgroundColor: "#4d4d4d" }}>
      <Layer>
        <Group x={0} y={0} ref={layerRef}>
          <Path
            data={
              "M 0 0 " +
              calculateTunnelPoints(path)
                .map(({ x, y }) => `L ${x} ${y}`)
                .join(" ") +
              " Z"
            }
            fill="#0a0a0a"
          />

          {SHOW_BLOCKS &&
            path.map(({ note, x, y, directionOnHit, newDirection }) => (
              <Rect
                key={note.when}
                x={
                  x +
                  (newDirection.x === directionOnHit.x
                    ? 0
                    : directionOnHit.x > 0
                    ? SCALE * 0.5
                    : SCALE * -0.5)
                }
                y={
                  y +
                  (newDirection.y === directionOnHit.y
                    ? 0
                    : directionOnHit.y > 0
                    ? SCALE * 0.5
                    : SCALE * -0.5)
                }
                width={SCALE}
                height={SCALE}
                offsetX={SCALE / 2}
                offsetY={SCALE / 2}
                fill="red"
              />
            ))}
          {SHOW_PATH && (
            <Path
              data={"M 0 0 " + path.map(({ x, y }) => `L ${x} ${y}`).join(" ")}
              stroke="#E5438A"
              opacity={0.75}
              strokeWidth={1}
            />
          )}
        </Group>

        <Group ref={circleGroupRef} x={width / 2} y={height / 2}>
          <Circle
            ref={farPartOfTrailRef}
            width={SCALE}
            height={SCALE}
            x={0}
            y={0}
            fill="#E5438A"
            opacity={0.33}
          />

          <Circle
            ref={nearPartOfTrailRef}
            x={0}
            y={0}
            width={SCALE}
            height={SCALE}
            fill="#E5438A"
            opacity={0.66}
          />

          <Circle x={0} y={0} width={SCALE} height={SCALE} fill="#E5438A" />
        </Group>
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
  circleGroup,
}: {
  currentStep: Step;
  time: number;
  circleGroup: Konva.Group | null;
}) {
  const scale = getCircleScale({ currentStep, time });
  circleGroup?.scale({ x: scale, y: scale });
}

function updateTrailPosition({
  nearPartOfTrail,
  farPartOfTrail,
  nextStep,
}: {
  nearPartOfTrail: Konva.Circle | null;
  farPartOfTrail: Konva.Circle | null;
  nextStep: Step;
}) {
  const NEAR_PART_OF_TRAIL_OFFSET = 0.25;

  nearPartOfTrail?.x(
    (nextStep.directionOnHit.x > 0
      ? -1 * NEAR_PART_OF_TRAIL_OFFSET
      : NEAR_PART_OF_TRAIL_OFFSET) * SCALE
  );
  nearPartOfTrail?.y(
    (nextStep.directionOnHit.y > 0
      ? -1 * NEAR_PART_OF_TRAIL_OFFSET
      : NEAR_PART_OF_TRAIL_OFFSET) * SCALE
  );

  const FAR_PART_OF_TRAIL_OFFSET = 0.5;
  farPartOfTrail?.x(
    (nextStep.directionOnHit.x > 0
      ? -1 * FAR_PART_OF_TRAIL_OFFSET
      : FAR_PART_OF_TRAIL_OFFSET) * SCALE
  );
  farPartOfTrail?.y(
    (nextStep.directionOnHit.y > 0
      ? -1 * FAR_PART_OF_TRAIL_OFFSET
      : FAR_PART_OF_TRAIL_OFFSET) * SCALE
  );
}

function updateObstaclesLayerPosition({
  currentStep,
  nextStep,
  time,
  layer,
  width,
  height,
}: {
  currentStep: Step;
  nextStep: Step;
  time: number;
  layer: Konva.Group | null;
  width: number;
  height: number;
}) {
  const offset =
    (time - currentStep.note.when) /
    (currentStep.note.when - nextStep.note.when);

  const containerXCenter = width / 2;
  const containerYCenter = height / 2;

  const x = currentStep.x + (currentStep.x - nextStep.x) * offset;
  const y = currentStep.y + (currentStep.y - nextStep.y) * offset;

  layer?.x(containerXCenter - x);
  layer?.y(containerYCenter - y);
}
