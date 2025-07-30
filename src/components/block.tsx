import { Rect } from "react-konva";
import {
  BLOCK_FADE_MIN_DURATION,
  BLOCK_HUE_CHANGE_INDEX_INTERVAL,
  BLOCK_HUE_CHANGE_OPEN_ANIMATION_INDEX_INTERVAL,
  BLOCK_WIDTH,
  BLOCK_START_FADE_OUT_AFTER_INDEX,
  BLOCK_START_HUE,
  BLOCK_HEIGHT,
  STAR_COLOR_CHANGE_MAX_DURATION,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
  INITIAL_VIZ_TYPE,
} from "@/constants";
import type { Step } from "@/lib/path";
import Konva from "konva";
import { useEffect, useRef } from "react";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { lerp } from "@/lib/utils";
import { useLocalStorage } from "react-use";
import type { VizType } from "@/types";

// TODO: fade stars in in case there are too many on the path ahead
// TOD: refactor viz types
export const Block = ({
  step: { note, x, y, directionOnHit, newDirection, duration },
  index,
  currentNoteIndex,
}: {
  step: Step;
  index: number;
  currentNoteIndex: number;
}) => {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const rectRef = useRef<Konva.Rect>(null);

  const height =
    newDirection.x === directionOnHit.x ? BLOCK_HEIGHT : BLOCK_WIDTH;
  const width =
    newDirection.y === directionOnHit.y ? BLOCK_HEIGHT : BLOCK_WIDTH;

  const startHeight = vizType === "TUNNEL" ? height : BLOCK_HEIGHT;
  const startWidth = vizType === "TUNNEL" ? width : BLOCK_HEIGHT;

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

    const animation = new Konva.Animation((frame) => {
      const time = (frame?.time ?? 0) / 1000;
      if (vizType === "TUNNEL") {
        const animationDuration = Math.max(duration, BLOCK_FADE_MIN_DURATION);
        rectRef.current?.opacity(
          1 - (animationDuration - time) / animationDuration
        );
      } else {
        const animationDuration = Math.min(
          duration,
          STAR_COLOR_CHANGE_MAX_DURATION
        );
        rectRef.current?.fill(
          `hsl(${hue}, ${lerp({
            start: 0,
            end: 100,
            time: time,
            duration: animationDuration,
          })}%, 60%)`
        );
        const newWidth = lerp({
          start: startWidth,
          end: width,
          time: time,
          duration: animationDuration,
        });
        const newHeight = lerp({
          start: startHeight,
          end: height,
          time: time,
          duration: animationDuration,
        });
        rectRef.current?.offsetX(newWidth / 2);
        rectRef.current?.offsetY(newHeight / 2);
        rectRef.current?.width(newWidth);
        rectRef.current?.height(newHeight);
      }
    }, rectRef.current?.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    duration,
    height,
    hue,
    shouldFadeIn,
    startHeight,
    startWidth,
    vizType,
    width,
  ]);

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
      width={startWidth}
      height={startHeight}
      offsetX={startWidth / 2}
      offsetY={startHeight / 2}
      opacity={vizType === "TUNNEL" ? 0 : 1}
      fill={`hsl(${hue}, ${vizType === "TUNNEL" ? 100 : 0}%, 60%)`}
    />
  );
};
