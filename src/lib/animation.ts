import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  CIRCLE_SIZE,
  DEBUG_SONG_END,
  // DEBUG_SONG_END,
  // IMAGE_REVEAL_SMOOTHING,
  SPARK_DISTANCE,
  SPARK_DURATION_MS,
  SPARK_OFFSETS,
  SPARK_RANDOM_FACTOR,
  SPARK_SIZE,
  STAR_COLOR_CHANGE_MAX_DURATION,
  // ZOOM_OUT_PADDING_FACTOR,
} from "@/constants";
import type { Step, VizType } from "@/types";
// import type { Region } from "@/types";
import { smoothstep } from "@/lib/smoothstep";
import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { lerp } from "@/lib/utils";
import type * as THREE from "three";
import { Color, CircleGeometry, Mesh, MeshBasicMaterial } from "three";
import type { RootState } from "@react-three/fiber";

export type AnimationState = {
  lastHandledBlockIndex: number;
};

export type GetBlockColor = (params: {
  x: number;
  y: number;
  index: number;
  saturation: number;
}) => string;

export const getCurrentStepAndTime = ({
  state,
  path,
}: {
  state: RootState;
  path: Step[];
}) => {
  const lastNoteTime = Math.max(...path.map(({ note: { when } }) => when));

  const time =
    state.clock.elapsedTime + (DEBUG_SONG_END ? lastNoteTime - 1 : 0);

  const currentStepIndex = Math.max(
    path.findLastIndex(({ note: { when } }) => time >= when),
    0
  );
  const currentStep = path[currentStepIndex];
  return { time, currentStepIndex, currentStep };
};

const updateRect = ({
  rect,
  currentStep,
  getBlockColor,
  index,
  time,
  vizType,
}: {
  rect: THREE.Mesh | null | undefined;
  currentStep: Step;
  getBlockColor: GetBlockColor;
  index: number;
  time: number;
  vizType: VizType;
}) => {
  if (!rect) {
    return;
  }

  const finalHeight =
    currentStep.newDirection.x === currentStep.directionOnHit.x
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;
  const finalWidth =
    currentStep.newDirection.y === currentStep.directionOnHit.y
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;

  const timeOffset = currentStep?.note.when ?? 0;

  const endTime =
    timeOffset + Math.min(currentStep.duration, STAR_COLOR_CHANGE_MAX_DURATION);

  const color = getBlockColor({
    x: currentStep.x,
    y: currentStep.y,
    index,
    saturation: lerp({
      start: 0,
      end: 100,
      time,
      timeOffset,
      endTime,
    }),
  });

  (rect.material as THREE.MeshStandardMaterial).color.set(color);

  const newWidth =
    vizType === "TUNNEL"
      ? finalWidth
      : lerp({
          start: BLOCK_HEIGHT,
          end: finalWidth,
          time,
          endTime,
          timeOffset,
        });
  const newHeight =
    vizType === "TUNNEL"
      ? finalHeight
      : lerp({
          start: BLOCK_HEIGHT,
          end: finalHeight,
          time,
          endTime,
          timeOffset,
        });

  rect.scale.set(
    newWidth / BLOCK_HEIGHT,
    newHeight / BLOCK_HEIGHT,
    lerp({
      start: BLOCK_HEIGHT,
      end: BLOCK_WIDTH,
      time,
      endTime,
      timeOffset,
    })
  );
};

export const updateRects = ({
  vizType,
  rects,
  path,
  currentStepIndex,
  currentStep,
  getBlockColor,
  animationState,
  scene,
  time,
}: {
  vizType: VizType;
  rects: (THREE.Mesh | null)[] | null;
  path: Step[];
  currentStepIndex: number;
  currentStep: Step;
  getBlockColor: GetBlockColor;
  animationState: AnimationState;
  scene: THREE.Scene | null;
  time: number;
}) => {
  updateRect({
    rect: rects?.[currentStepIndex],
    currentStep,
    getBlockColor,
    index: currentStepIndex,
    time,
    vizType,
  });

  if (animationState.lastHandledBlockIndex < currentStepIndex) {
    animationState.lastHandledBlockIndex = currentStepIndex;

    if (
      currentStep.directionOnHit.x !== currentStep.newDirection.x ||
      currentStep.directionOnHit.y !== currentStep.newDirection.y
    ) {
      displaySparks({
        currentStep,
        blockColor: getBlockColor({
          x: currentStep.x,
          y: currentStep.y,
          index: currentStepIndex,
          saturation: 100,
        }),
        scene,
      });
    }
  }

  if (DEBUG_SONG_END) {
    path.slice(0, currentStepIndex).forEach((step, index) =>
      updateRect({
        rect: rects?.[index],
        currentStep: step,
        getBlockColor,
        index,
        time,
        vizType,
      })
    );
  }
};

// const zoomOut = (
//   layer: Konva.Layer | null,
//   denseRegion: Region,
//   stage: Konva.Stage,
//   imageRef: Konva.Image | null
// ) => {
//   if (!layer) {
//     return;
//   }

//   const currentScaleX = layer.scaleX();

//   const actualWidth = denseRegion.endX - denseRegion.startX;
//   const actualHeight = denseRegion.endY - denseRegion.startY;

//   const desiredScale = Math.min(
//     stage.height() /
//       (actualHeight + stage.height() * ZOOM_OUT_PADDING_FACTOR * 2),
//     stage.width() / (actualWidth + stage.width() * ZOOM_OUT_PADDING_FACTOR * 2)
//   );

//   if (Math.abs(desiredScale - layer.scaleX()) < 0.001) {
//     if (imageRef) {
//       imageRef.opacity(
//         smoothstep(imageRef.opacity(), 0.125, IMAGE_REVEAL_SMOOTHING)
//       );
//     }

//     return;
//   }

//   const newScale = smoothstep(
//     currentScaleX,
//     desiredScale,
//     CAMERA_FOLLOW_SMOOTHING
//   );

//   layer.scale({ x: newScale, y: newScale });

//   const desiredX =
//     stage.width() / 2 -
//     ((denseRegion.startX + denseRegion.endX) / 2) * newScale;
//   const desiredY =
//     stage.height() / 2 -
//     ((denseRegion.startY + denseRegion.endY) / 2) * newScale;

//   layer.position({
//     x: smoothstep(layer.x(), desiredX, CAMERA_FOLLOW_SMOOTHING),
//     y: smoothstep(layer.y(), desiredY, CAMERA_FOLLOW_SMOOTHING),
//   });
// };

const displaySparks = ({
  currentStep,
  blockColor,
  scene,
}: {
  currentStep: Step;
  blockColor: string;
  scene: THREE.Scene | null;
}) => {
  if (!scene) {
    return;
  }

  const color = new Color(blockColor).multiplyScalar(2);

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
    const spark = new Mesh(
      new CircleGeometry(SPARK_SIZE, 32),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      })
    );

    spark.position.set(initialX, initialY, 0);
    scene.add(spark);

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

    const startTime = performance.now();
    const endTime = startTime + SPARK_DURATION_MS;

    const stepFrame = (time: number) => {
      spark.position.set(
        lerp({
          start: initialX,
          end: finalX,
          time,
          timeOffset: startTime,
          endTime,
        }),
        lerp({
          start: initialY,
          end: finalY,
          time,
          timeOffset: startTime,
          endTime,
        }),
        0
      );

      const scale = lerp({
        start: 1,
        end: 0.25,
        time,
        timeOffset: startTime,
        endTime,
      });
      spark.scale.set(scale, scale, scale);

      spark.material.opacity = lerp({
        start: 1,
        end: 0,
        time,
        timeOffset: startTime,
        endTime,
      });

      if (time < endTime) {
        requestAnimationFrame(stepFrame);
      } else {
        scene.remove(spark);
        spark.geometry.dispose();
        spark.material.dispose();
      }
    };

    requestAnimationFrame(stepFrame);
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

export const updateCircleScale = ({
  currentStep,
  time,
  circle,
}: {
  currentStep: Step;
  time: number;
  circle: THREE.Mesh | null;
}) => {
  const scale = getCircleScale({ currentStep, time });
  circle?.scale.set(scale, scale, circle.scale.z);
};

export const updateCirclePosition = ({
  currentStep,
  nextStep,
  time,
  circle,
  trailHead,
}: {
  currentStep: Step;
  nextStep: Step | undefined;
  time: number;
  circle: THREE.Mesh | null;
  trailHead: THREE.Mesh | null;
}) => {
  if (!nextStep) {
    return;
  }

  const x = lerp({
    start: currentStep.x,
    end: nextStep.x,
    time,
    timeOffset: currentStep.note.when,
    endTime: nextStep.note.when,
  });
  const y = lerp({
    start: currentStep.y,
    end: nextStep.y,
    time,
    timeOffset: currentStep.note.when,
    endTime: nextStep.note.when,
  });

  circle?.position.set(x, y, circle.position.z);

  const trailHeadOffsetX =
    Math.abs(nextStep.x - x) < CIRCLE_SIZE / 4
      ? 0
      : nextStep.x > currentStep.x
      ? CIRCLE_SIZE / 2
      : -CIRCLE_SIZE / 2;
  const trailHeadOffsetY =
    Math.abs(nextStep.y - y) < CIRCLE_SIZE / 4
      ? 0
      : nextStep.y > currentStep.y
      ? CIRCLE_SIZE / 2
      : -CIRCLE_SIZE / 2;

  trailHead?.position.set(x + trailHeadOffsetX, y + trailHeadOffsetY, 0);
};

export const updateCameraPosition = ({
  camera,
  circle,
}: {
  camera: THREE.Camera | null;
  circle: THREE.Mesh | null;
}) => {
  if (!camera || !circle) {
    return;
  }

  const desiredX = circle.position.x;
  const desiredY = circle.position.y;

  const currentX = camera.position.x;
  const currentY = camera.position.y;

  const newX = smoothstep(currentX, desiredX, CAMERA_FOLLOW_SMOOTHING);
  const newY = smoothstep(currentY, desiredY, CAMERA_FOLLOW_SMOOTHING);

  camera.position.set(newX, newY, camera.position.z);
};
