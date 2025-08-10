import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  DEBUG_SONG_END,
  IMAGE_REVEAL_SMOOTHING,
  SPARK_DISTANCE,
  SPARK_DURATION,
  SPARK_OFFSETS,
  SPARK_RANDOM_FACTOR,
  SPARK_SIZE,
  STAR_COLOR_CHANGE_MAX_DURATION,
  ZOOM_OUT_PADDING_FACTOR,
} from "@/constants";
import type { ImageData, Step, VizType } from "@/types";
import type { Region } from "@/types";
import { smoothstep } from "@/lib/smoothstep";
import Konva from "konva";
import { range } from "es-toolkit";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { lerp } from "@/lib/utils";

export type AnimationState = {
  lastHandledBlockIndex: number;
};

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
  animationState,
  konvaObjects,
}: {
  time: number;
  lastNoteTime: number;
  denseRegion: Region | undefined;
  imageData: ImageData | undefined;
  path: Step[];
  vizType: VizType;
  getBlockColor: GetBlockColor;
  animationState: AnimationState;
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
  if (time > lastNoteTime && denseRegion && imageData && konvaObjects.stage) {
    zoomOut(
      konvaObjects.layer,
      denseRegion,
      konvaObjects.stage,
      konvaObjects.image
    );
  }

  const currentStepIndex = Math.max(
    path.findLastIndex(({ note: { when } }) => time >= when),
    0
  );
  const currentStep = path[currentStepIndex];
  const nextStep = path[currentStepIndex + 1];

  updateTrailPosition(konvaObjects);

  updateCirclePosition({
    currentStep,
    nextStep,
    time,
    ...konvaObjects,
  });

  updateCameraPosition(konvaObjects);

  updateCircleScale({
    currentStep,
    time,
    ...konvaObjects,
  });

  updateRects({
    vizType,
    path,
    currentStepIndex,
    currentStep,
    getBlockColor,
    animationState,
    ...konvaObjects,
  });
};

const getBlockFinalForm = ({
  vizType,
  currentStep,
  index,
  getBlockColor,
}: {
  vizType: VizType;
  currentStep: Step;
  index: number;
  getBlockColor: GetBlockColor;
}): Konva.RectConfig => {
  const form: Konva.RectConfig = {};

  const height =
    currentStep.newDirection.x === currentStep.directionOnHit.x
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;
  const width =
    currentStep.newDirection.y === currentStep.directionOnHit.y
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;

  form.fill = getBlockColor({
    x: currentStep.x,
    y: currentStep.y,
    index,
    saturation: 100,
  });

  form.width = width;
  form.height = height;
  form.offsetX = width / 2;
  form.offsetY = height / 2;

  if (vizType === "TUNNEL") {
    form.opacity = 1;
  }

  return form;
};

const updateRects = ({
  vizType,
  rects,
  path,
  currentStepIndex,
  currentStep,
  getBlockColor,
  animationState,
  layer,
}: {
  vizType: VizType;
  rects: (Konva.Rect | null)[] | null;
  path: Step[];
  currentStepIndex: number;
  currentStep: Step;
  getBlockColor: GetBlockColor;
  animationState: AnimationState;
  layer: Konva.Layer | null;
}) => {
  const rect = rects?.[currentStepIndex];
  if (!rect) {
    return;
  }

  const animationDuration = Math.min(
    currentStep.duration,
    STAR_COLOR_CHANGE_MAX_DURATION
  );

  if (animationState.lastHandledBlockIndex < currentStepIndex && layer) {
    animationState.lastHandledBlockIndex = currentStepIndex;

    const blockFinalForm = getBlockFinalForm({
      vizType,
      currentStep,
      index: currentStepIndex,
      getBlockColor,
    });

    const tween = new Konva.Tween({
      node: rect,
      duration: animationDuration,
      ...blockFinalForm,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        tween.destroy();
      },
    });
    tween.play();

    if (
      currentStep.directionOnHit.x !== currentStep.newDirection.x ||
      currentStep.directionOnHit.y !== currentStep.newDirection.y
    ) {
      displaySparks({ currentStep, fill: blockFinalForm.fill, layer });
    }
  }

  if (DEBUG_SONG_END) {
    range(0, currentStepIndex).forEach((index) => {
      rects?.[index]?.setAttrs(
        getBlockFinalForm({
          vizType,
          currentStep: path[index],
          index,
          getBlockColor,
        })
      );
    });
  }
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

const displaySparks = ({
  currentStep,
  fill,
  layer,
}: {
  currentStep: Step;
  fill: Konva.CircleConfig["fill"];
  layer: Konva.Layer;
}) => {
  const initialX =
    currentStep.newDirection.x === currentStep.directionOnHit.x
      ? currentStep.x
      : getXOfStepInYAxis(
          { directionOnHit: currentStep.directionOnHit, x: currentStep.x },
          BLOCK_HEIGHT * 3 + SPARK_SIZE
        );

  const initialY =
    currentStep.newDirection.y === currentStep.directionOnHit.y
      ? currentStep.y
      : getYOfStepInXAxis(
          { directionOnHit: currentStep.directionOnHit, y: currentStep.y },
          BLOCK_HEIGHT * 3 + SPARK_SIZE
        );

  SPARK_OFFSETS.forEach((offset) => {
    const sparkRect = new Konva.Circle({
      x: initialX,
      y: initialY,
      radius: SPARK_SIZE,
      fill,
      opacity: 1,
    });
    layer.add(sparkRect);

    const finalX =
      currentStep.newDirection.x === currentStep.directionOnHit.x
        ? initialX + offset * BLOCK_WIDTH
        : getXOfStepInYAxis(
            {
              directionOnHit: currentStep.directionOnHit,
              x: initialX,
            },
            BLOCK_HEIGHT * 3 +
              SPARK_DISTANCE *
                (1 - SPARK_RANDOM_FACTOR + Math.random() * SPARK_RANDOM_FACTOR)
          );

    const finalY =
      currentStep.newDirection.y === currentStep.directionOnHit.y
        ? initialY + offset * BLOCK_WIDTH
        : getYOfStepInXAxis(
            {
              directionOnHit: currentStep.directionOnHit,
              y: initialY,
            },
            BLOCK_HEIGHT * 3 +
              SPARK_DISTANCE *
                (1 - SPARK_RANDOM_FACTOR + Math.random() * SPARK_RANDOM_FACTOR)
          );

    const sparkTween = new Konva.Tween({
      node: sparkRect,
      duration: SPARK_DURATION,
      x: finalX,
      y: finalY,
      rotation: Math.random() * 360,
      opacity: 0,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        sparkTween.destroy();
        sparkRect.destroy();
      },
    });

    sparkTween.play();
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
  nextStep: Step | undefined;
  time: number;
  circle: Konva.Circle | null;
}) => {
  if (!nextStep) {
    return;
  }

  circle?.position({
    x: lerp({
      start: currentStep.x,
      end: nextStep.x,
      time,
      timeOffset: currentStep.note.when,
      endTime: nextStep.note.when,
    }),
    y: lerp({
      start: currentStep.y,
      end: nextStep.y,
      time,
      timeOffset: currentStep.note.when,
      endTime: nextStep.note.when,
    }),
  });
};

const updateCameraPosition = ({
  layer,
  circle,
  stage,
}: {
  layer: Konva.Layer | null;
  circle: Konva.Circle | null;
  stage: Konva.Stage | null;
}) => {
  if (!stage) {
    return;
  }

  const width = stage.width();
  const height = stage.height();

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
