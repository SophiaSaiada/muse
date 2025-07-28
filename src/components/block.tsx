import { Rect } from "react-konva";
import {
  BLOCK_FADE_IN_DURATION,
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
  step: { note, x, y, directionOnHit, newDirection },
  index,
  currentNoteIndex,
}: {
  step: Step;
  index: number;
  currentNoteIndex: number;
}) => {
  const rectRef = useRef<Konva.Rect>(null);

  useEffect(() => {
    if (currentNoteIndex !== index) {
      return;
    }

    const animation = new Konva.Animation((frame) => {
      const time = frame?.time ?? 0;

      rectRef.current?.opacity(
        1 - (BLOCK_FADE_IN_DURATION - time) / BLOCK_FADE_IN_DURATION
      );
    }, rectRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [currentNoteIndex, index]);

  return (
    <Rect
      key={note.when}
      ref={rectRef}
      x={
        newDirection.x === directionOnHit.x
          ? x
          : getXOfStepInYAxis({ directionOnHit, x }, BLOCK_SCALE + SCALE)
      }
      y={
        newDirection.y === directionOnHit.y
          ? y
          : getYOfStepInXAxis({ directionOnHit, y }, BLOCK_SCALE + SCALE)
      }
      width={BLOCK_SCALE}
      height={BLOCK_SCALE}
      offsetX={BLOCK_SCALE / 2}
      offsetY={BLOCK_SCALE / 2}
      opacity={index < currentNoteIndex ? 1 : 0}
      fill={`hsl(${
        Math.round(
          (index /
            (index < BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
              ? BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL
              : BLOCK_HUE_CHANGE_INDEX_INTERVAL)) *
            360 +
            BLOCK_START_HUE
        ) % 360
      }, 100%, 60%)`}
    />
  );
};
