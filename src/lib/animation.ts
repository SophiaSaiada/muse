import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  IMAGE_REVEAL_SMOOTHING,
  STAR_COLOR_CHANGE_MAX_DURATION,
  ZOOM_OUT_PADDING_FACTOR,
} from "@/constants";
import type { ImageData, Step, VizType } from "@/types";
import type { Region } from "@/types";
import { smoothstep } from "@/lib/smoothstep";
import type Konva from "konva";
import { lerp } from "@/lib/utils";
import { range } from "es-toolkit";

export type GetBlockColor = (params: {
  x: number;
  y: number;
  index: number;
  saturation: number;
}) => string;

export const handleAnimation = ({
  time,
  lastNoteTime,
  denseRegion,
  imageData,
  path,
  vizType,
  getBlockColor,
  konvaObjects,
}: {
  time: number;
  lastNoteTime: number;
  denseRegion: Region | undefined;
  imageData: ImageData | undefined;
  path: Step[];
  vizType: VizType;
  getBlockColor: GetBlockColor;
  konvaObjects: {
    layer: Konva.Layer | null;
    stage: Konva.Stage | null;
    image: Konva.Image | null;
    nearPartOfTrail: Konva.Circle | null;
    farPartOfTrail: Konva.Circle | null;
    circle: Konva.Circle | null;
    rects: (Konva.Rect | null)[] | null;
  };
}) => {
  if (!konvaObjects.stage) {
    return;
  }

  if (time > lastNoteTime) {
    if (denseRegion && imageData) {
      zoomOut(
        konvaObjects.layer,
        denseRegion,
        konvaObjects.stage,
        konvaObjects.image
      );
    }

    return;
  }

  const nextStepIndex = path.findIndex(({ note: { when } }) => time < when);
  if (nextStepIndex <= 0) {
    return;
  }

  const width = konvaObjects.stage.width();
  const height = konvaObjects.stage.height();

  const nextStep = path[nextStepIndex];
  const currentStep = path[nextStepIndex - 1];

  updateTrailPosition(konvaObjects);

  updateCirclePosition({
    currentStep,
    nextStep,
    time,
    ...konvaObjects,
  });

  updateCameraPosition({
    width,
    height,
    ...konvaObjects,
  });

  updateCircleScale({
    currentStep,
    time,
    ...konvaObjects,
  });

  updateRects({
    vizType,
    path,
    nextStepIndex,
    currentStep,
    time,
    getBlockColor,
    ...konvaObjects,
  });
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
  denseRegion: Region,
  stage: Konva.Stage,
  imageRef: Konva.Image | null
) => {
  if (!layer) {
    return;
  }

  const currentScaleX = layer.scaleX();

  const actualWidth = denseRegion.endX - denseRegion.startX;
  const actualHeight = denseRegion.endY - denseRegion.startY;

  const desiredScale = Math.min(
    stage.height() /
      (actualHeight + stage.height() * ZOOM_OUT_PADDING_FACTOR * 2),
    stage.width() / (actualWidth + stage.width() * ZOOM_OUT_PADDING_FACTOR * 2)
  );

  if (Math.abs(desiredScale - layer.scaleX()) < 0.001) {
    if (imageRef) {
      imageRef.opacity(
        smoothstep(imageRef.opacity(), 0.125, IMAGE_REVEAL_SMOOTHING)
      );
    }

    return;
  }

  const newScale = smoothstep(
    currentScaleX,
    desiredScale,
    CAMERA_FOLLOW_SMOOTHING
  );

  layer.scale({ x: newScale, y: newScale });

  const desiredX =
    stage.width() / 2 -
    ((denseRegion.startX + denseRegion.endX) / 2) * newScale;
  const desiredY =
    stage.height() / 2 -
    ((denseRegion.startY + denseRegion.endY) / 2) * newScale;

  layer.position({
    x: smoothstep(layer.x(), desiredX, CAMERA_FOLLOW_SMOOTHING),
    y: smoothstep(layer.y(), desiredY, CAMERA_FOLLOW_SMOOTHING),
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
const updateCircleScale = ({
  currentStep,
  time,
  circle,
}: {
  currentStep: Step;
  time: number;
  circle: Konva.Circle | null;
}) => {
  const scale = getCircleScale({ currentStep, time });
  circle?.scale({ x: scale, y: scale });
};

const updateTrailPosition = ({
  nearPartOfTrail,
  farPartOfTrail,
  circle,
}: {
  nearPartOfTrail: Konva.Circle | null;
  farPartOfTrail: Konva.Circle | null;
  circle: Konva.Circle | null;
}) => {
  farPartOfTrail?.x(nearPartOfTrail?.x());
  farPartOfTrail?.y(nearPartOfTrail?.y());

  nearPartOfTrail?.x(circle?.x());
  nearPartOfTrail?.y(circle?.y());
};

const updateCirclePosition = ({
  currentStep,
  nextStep,
  time,
  circle,
}: {
  currentStep: Step;
  nextStep: Step;
  time: number;
  circle: Konva.Circle | null;
}) => {
  const offset =
    (time - currentStep.note.when) /
    (currentStep.note.when - nextStep.note.when);

  const x = currentStep.x + (currentStep.x - nextStep.x) * offset;
  const y = currentStep.y + (currentStep.y - nextStep.y) * offset;

  circle?.x(x);
  circle?.y(y);
};

const updateCameraPosition = ({
  layer,
  circle,
  width,
  height,
}: {
  layer: Konva.Layer | null;
  circle: Konva.Circle | null;
  width: number;
  height: number;
}) => {
  const containerXCenter = width / 2;
  const containerYCenter = height / 2;

  if (!layer || !circle) {
    return;
  }

  const desiredX = containerXCenter - circle.x();
  const desiredY = containerYCenter - circle.y();

  const currentX = layer.x();
  const currentY = layer.y();

  const newX = smoothstep(currentX, desiredX, CAMERA_FOLLOW_SMOOTHING);
  const newY = smoothstep(currentY, desiredY, CAMERA_FOLLOW_SMOOTHING);

  layer.x(newX);
  layer.y(newY);
};
