import { Rect } from "react-konva";
import {
  BLOCK_FADE_IN_MAX_INDEX_DURATION,
  BLOCK_FADE_IN_MIN_DURATION,
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_SCALE,
  BLOCK_START_HUE,
  SCALE,
} from "../constants";
import type { Step } from "../lib/path";
import Konva from "konva";
import { useEffect, useRef } from "react";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "../lib/tunnel";

export const Block = ({
  step: { note, x, y, directionOnHit, newDirection, duration },
  index,
  currentNoteIndex,
}: {
  step: Step;
  index: number;
  currentNoteIndex: number;
}) => {
  const rectRef = useRef<Konva.Rect>(null);

  const height = newDirection.x === directionOnHit.x ? SCALE : BLOCK_SCALE;
  const width = newDirection.y === directionOnHit.y ? SCALE : BLOCK_SCALE;

  const hue =
    Math.round(
      (index /
        (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
        360 +
        BLOCK_START_HUE
    ) % 360;

  const shouldRunAnimation =
    currentNoteIndex - BLOCK_FADE_IN_MAX_INDEX_DURATION <= index &&
    index <= currentNoteIndex;

  useEffect(() => {
    if (!shouldRunAnimation) {
      return;
    }

    const animationDuration = Math.max(duration, BLOCK_FADE_IN_MIN_DURATION);

    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;
      rectRef.current?.opacity(
        1 - (animationDuration - time) / animationDuration
      );
    }, rectRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, shouldRunAnimation]);

  return (
    <Rect
      key={note.when}
      ref={rectRef}
      x={
        newDirection.x === directionOnHit.x
          ? x
          : getXOfStepInYAxis({ directionOnHit, x }, SCALE * 2)
      }
      y={
        newDirection.y === directionOnHit.y
          ? y
          : getYOfStepInXAxis({ directionOnHit, y }, SCALE * 2)
      }
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      opacity={
        index < currentNoteIndex - BLOCK_FADE_IN_MAX_INDEX_DURATION ? 1 : 0
      }
      fill={`hsl(${hue}, 100%, 60%)`}
    />
  );
};
