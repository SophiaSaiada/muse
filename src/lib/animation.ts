import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BOUNCE_ANIMATION_HALF_TIME,
  BOUNCE_ANIMATION_SCALE_FACTOR,
  CAMERA_FOLLOW_SMOOTHING,
  // DEBUG_SONG_END,
  // IMAGE_REVEAL_SMOOTHING,
  // SPARK_DISTANCE,
  // SPARK_DURATION,
  // SPARK_OFFSETS,
  // SPARK_RANDOM_FACTOR,
  // SPARK_SIZE,
  STAR_COLOR_CHANGE_MAX_DURATION,
  // ZOOM_OUT_PADDING_FACTOR,
} from "@/constants";
import type { Step, VizType } from "@/types";
// import type { Region } from "@/types";
import { smoothstep } from "@/lib/smoothstep";
// import Konva from "konva";
// import { range } from "es-toolkit";
// import { getXOfStepInYAxis, getYOfStepInXAxis } from "@/lib/tunnel";
import { lerp } from "@/lib/utils";
import type * as THREE from "three";

export type AnimationState = {
  lastHandledBlockIndex: number;
};

export type GetBlockColor = (params: {
  x: number;
  y: number;
  index: number;
  saturation: number;
}) => string;

// export const handleAnimation = ({
//   time,
//   lastNoteTime,
//   denseRegion,
//   imageData,
//   path,
//   vizType,
//   getBlockColor,
//   animationState,
//   konvaObjects,
// }: {
//   time: number;
//   lastNoteTime: number;
//   denseRegion: Region | undefined;
//   imageData: ImageData | undefined;
//   path: Step[];
//   vizType: VizType;
//   getBlockColor: GetBlockColor;
//   animationState: AnimationState;
//   konvaObjects: {
//     layer: Konva.Layer | null;
//     stage: Konva.Stage | null;
//     image: Konva.Image | null;
//     nearPartOfTrail: Konva.Circle | null;
//     farPartOfTrail: Konva.Circle | null;
//     circle: Konva.Circle | null;
//     rects: (Konva.Rect | null)[] | null;
//   };
// }) => {
//   if (time > lastNoteTime) {
//     if (denseRegion && imageData && konvaObjects.stage) {
//       zoomOut(
//         konvaObjects.layer,
//         denseRegion,
//         konvaObjects.stage,
//         konvaObjects.image
//       );
//     }
//     return;
//   }

//   const currentStepIndex = Math.max(
//     path.findLastIndex(({ note: { when } }) => time >= when),
//     0
//   );
//   const currentStep = path[currentStepIndex];
//   const nextStep = path[currentStepIndex + 1];

//   updateTrailPosition(konvaObjects);

//   updateCirclePosition({
//     currentStep,
//     nextStep,
//     time,
//     ...konvaObjects,
//   });

//   updateCameraPosition(konvaObjects);

//   updateCircleScale({
//     currentStep,
//     time,
//     ...konvaObjects,
//   });

//   updateRects({
//     vizType,
//     path,
//     currentStepIndex,
//     currentStep,
//     getBlockColor,
//     animationState,
//     ...konvaObjects,
//   });
// };

const getBlockFinalForm = ({
  currentStep,
  index,
  getBlockColor,
}: {
  currentStep: Step;
  index: number;
  getBlockColor: GetBlockColor;
}): {
  width: number;
  height: number;
  fill: string;
  offsetX: number;
  offsetY: number;
  opacity: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOpacity: number;
} => {
  const height =
    currentStep.newDirection.x === currentStep.directionOnHit.x
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;
  const width =
    currentStep.newDirection.y === currentStep.directionOnHit.y
      ? BLOCK_HEIGHT
      : BLOCK_WIDTH;

  const fill = getBlockColor({
    x: currentStep.x,
    y: currentStep.y,
    index,
    saturation: 100,
  });

  const offsetX = width / 2;
  const offsetY = height / 2;

  const shadowColor = fill;
  const shadowBlur = BLOCK_WIDTH / 2;
  const shadowOpacity = 1;

  return {
    width,
    height,
    fill,
    offsetX,
    offsetY,
    opacity: 1,
    shadowColor,
    shadowBlur,
    shadowOpacity,
  };
};

export const updateRects = ({
  vizType,
  rects,
  // path,
  currentStepIndex,
  currentStep,
  getBlockColor,
  animationState,
  // layer,
  time,
}: {
  vizType: VizType;
  rects: (THREE.Mesh | null)[] | null;
  path: Step[];
  currentStepIndex: number;
  currentStep: Step;
  getBlockColor: GetBlockColor;
  animationState: AnimationState;
  layer: null;
  time: number;
}) => {
  const rect = rects?.[currentStepIndex];
  if (!rect) {
    return;
  }

  if (animationState.lastHandledBlockIndex < currentStepIndex) {
    animationState.lastHandledBlockIndex = currentStepIndex;

    const blockFinalForm = getBlockFinalForm({
      currentStep,
      index: currentStepIndex,
      getBlockColor,
    });

    const timeOffset = currentStep?.note.when ?? 0;

    const endTime =
      timeOffset +
      Math.min(currentStep.duration, STAR_COLOR_CHANGE_MAX_DURATION);

    (rect.material as THREE.MeshStandardMaterial).color.set(
      getBlockColor({
        x: currentStep.x,
        y: currentStep.y,
        index: currentStepIndex,
        saturation: lerp({
          start: 0,
          end: 100,
          time,
          timeOffset,
          endTime,
        }),
      })
    );
    const newWidth =
      vizType === "TUNNEL"
        ? blockFinalForm.width
        : lerp({
            start: BLOCK_HEIGHT,
            end: blockFinalForm.width,
            time,
            endTime,
            timeOffset,
          });
    const newHeight =
      vizType === "TUNNEL"
        ? blockFinalForm.height
        : lerp({
            start: BLOCK_HEIGHT,
            end: blockFinalForm.height,
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
    // rect.scale.set(newWidth, newHeight, 1);

    // if (
    //   currentStep.directionOnHit.x !== currentStep.newDirection.x ||
    //   currentStep.directionOnHit.y !== currentStep.newDirection.y
    // ) {
    //   displaySparks({ currentStep, fill: blockFinalForm.fill, layer });
    // }
  }

  // if (DEBUG_SONG_END) {
  //   range(0, currentStepIndex).forEach((index) => {
  //     rects?.[index]?.setAttrs(
  //       getBlockFinalForm({
  //         vizType,
  //         currentStep: path[index],
  //         index,
  //         getBlockColor,
  //       })
  //     );
  //   });
  // }
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

// const displaySparks = ({
//   currentStep,
//   fill,
//   layer,
// }: {
//   currentStep: Step;
//   fill: Konva.CircleConfig["fill"];
//   layer: Konva.Layer;
// }) => {
//   const initialX =
//     currentStep.newDirection.x === currentStep.directionOnHit.x
//       ? currentStep.x
//       : getXOfStepInYAxis(
//           { directionOnHit: currentStep.directionOnHit, x: currentStep.x },
//           BLOCK_HEIGHT * 3 + SPARK_SIZE
//         );

//   const initialY =
//     currentStep.newDirection.y === currentStep.directionOnHit.y
//       ? currentStep.y
//       : getYOfStepInXAxis(
//           { directionOnHit: currentStep.directionOnHit, y: currentStep.y },
//           BLOCK_HEIGHT * 3 + SPARK_SIZE
//         );

//   SPARK_OFFSETS.forEach((offset) => {
//     const spark = new Konva.Circle({
//       x: initialX,
//       y: initialY,
//       radius: SPARK_SIZE,
//       scaleX: 1,
//       scaleY: 1,
//       fill,
//       opacity: 1,
//     });
//     layer.add(spark);

//     const finalX =
//       currentStep.newDirection.x === currentStep.directionOnHit.x
//         ? initialX + offset * BLOCK_WIDTH
//         : getXOfStepInYAxis(
//             {
//               directionOnHit: currentStep.directionOnHit,
//               x: initialX,
//             },
//             BLOCK_HEIGHT * 3 +
//               SPARK_DISTANCE *
//                 (1 - SPARK_RANDOM_FACTOR + Math.random() * SPARK_RANDOM_FACTOR)
//           );

//     const finalY =
//       currentStep.newDirection.y === currentStep.directionOnHit.y
//         ? initialY + offset * BLOCK_WIDTH
//         : getYOfStepInXAxis(
//             {
//               directionOnHit: currentStep.directionOnHit,
//               y: initialY,
//             },
//             BLOCK_HEIGHT * 3 +
//               SPARK_DISTANCE *
//                 (1 - SPARK_RANDOM_FACTOR + Math.random() * SPARK_RANDOM_FACTOR)
//           );

//     const sparkTween = new Konva.Tween({
//       node: spark,
//       duration: SPARK_DURATION,
//       x: finalX,
//       y: finalY,
//       scaleX: 0.25,
//       scaleY: 0.25,
//       rotation: Math.random() * 360,
//       opacity: 0,
//       easing: Konva.Easings.EaseOut,
//       onFinish: () => {
//         sparkTween.destroy();
//         spark.destroy();
//       },
//     });

//     sparkTween.play();
//   });
// };

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

// const updateTrailPosition = ({
//   nearPartOfTrail,
//   farPartOfTrail,
//   circle,
// }: {
//   nearPartOfTrail: Konva.Circle | null;
//   farPartOfTrail: Konva.Circle | null;
//   circle: Konva.Circle | null;
// }) => {
//   farPartOfTrail?.x(nearPartOfTrail?.x());
//   farPartOfTrail?.y(nearPartOfTrail?.y());

//   nearPartOfTrail?.x(circle?.x());
//   nearPartOfTrail?.y(circle?.y());
// };

export const updateCirclePosition = ({
  currentStep,
  nextStep,
  time,
  circle,
}: {
  currentStep: Step;
  nextStep: Step | undefined;
  time: number;
  circle: THREE.Mesh | null;
}) => {
  if (!nextStep) {
    return;
  }

  circle?.position.set(
    lerp({
      start: currentStep.x,
      end: nextStep.x,
      time,
      timeOffset: currentStep.note.when,
      endTime: nextStep.note.when,
    }),
    lerp({
      start: currentStep.y,
      end: nextStep.y,
      time,
      timeOffset: currentStep.note.when,
      endTime: nextStep.note.when,
    }),
    circle.position.z
  );
};

export const updateCameraPosition = ({
  camera,
  circle,
}: {
  camera: THREE.Camera;
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
