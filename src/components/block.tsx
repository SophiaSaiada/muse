import { Rect } from "react-konva";
import {
  BLOCK_FADE_MIN_DURATION,
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_WIDTH,
  BLOCK_START_FADE_OUT_AFTER_INDEX,
  BLOCK_START_HUE,
  BLOCK_HEIGHT,
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

  const height =
    newDirection.x === directionOnHit.x ? BLOCK_HEIGHT : BLOCK_WIDTH;
  const width =
    newDirection.y === directionOnHit.y ? BLOCK_HEIGHT : BLOCK_WIDTH;

  const hue =
    Math.round(
      (index /
        (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
          : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
        360 +
        BLOCK_START_HUE
    ) % 360;

  const shouldFadeOut =
    index <= currentNoteIndex - BLOCK_START_FADE_OUT_AFTER_INDEX;
  const shouldFadeIn = !shouldFadeOut && index <= currentNoteIndex;

  useEffect(() => {
    if (!shouldFadeIn) {
      return;
    }

    const animationDuration = Math.max(duration, BLOCK_FADE_MIN_DURATION);

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
  }, [duration, shouldFadeIn]);

  useEffect(() => {
    if (!shouldFadeOut) {
      return;
    }

    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;
      rectRef.current?.opacity(
        Math.max(0, BLOCK_FADE_MIN_DURATION - time) / BLOCK_FADE_MIN_DURATION
      );
    }, rectRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, shouldFadeOut]);

  return (
    <Rect
      key={note.when}
      ref={rectRef}
      x={
        newDirection.x === directionOnHit.x
          ? x
          : getXOfStepInYAxis({ directionOnHit, x }, BLOCK_HEIGHT * 2)
      }
      y={
        newDirection.y === directionOnHit.y
          ? y
          : getYOfStepInXAxis({ directionOnHit, y }, BLOCK_HEIGHT * 2)
      }
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      opacity={0}
      fill={`hsl(${hue}, 100%, 60%)`}
    />
  );
};
