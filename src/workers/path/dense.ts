import type { Feature, LineString } from "geojson";
import type { Direction, NoteOrBeat, Step } from "../../types";
import { lineString, booleanPointOnLine, point } from "@turf/turf";

const DIRECTIONS = [
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
];

const rotateDirection = (direction: Direction, clockwise: boolean) => {
  const directionIndex = DIRECTIONS.findIndex(
    ({ x, y }) => x === Math.sign(direction.x) && y === Math.sign(direction.y)
  );
  const rotatedDirectionIndex =
    (directionIndex + (clockwise ? 1 : -1) + DIRECTIONS.length) %
    DIRECTIONS.length;
  const rotatedUnscaledDirection = DIRECTIONS[rotatedDirectionIndex];
  const scale = Math.abs(direction.x);
  return {
    x: rotatedUnscaledDirection.x * scale,
    y: rotatedUnscaledDirection.y * scale,
  };
};

const EPSILON = 20;

// TODO: fix point not colliding with block at 1:31
const getDirection = (
  path: [number, number][],
  lastChosenDirection: Direction,
  duration: number
) => {
  const previousPoint = path.at(-1)!;

  const clockwiseDirection = rotateDirection(lastChosenDirection, true);
  const counterClockwiseDirection = rotateDirection(lastChosenDirection, false);

  const clockwisePoint = applyDirectionOnPoint(
    previousPoint,
    clockwiseDirection,
    duration
  );

  const counterClockwisePoint = applyDirectionOnPoint(
    previousPoint,
    counterClockwiseDirection,
    duration
  );

  const pathAsFeature = lineString(
    path.length > 1 ? path : [...path, ...path] // lineString requires at least 2 points, so we duplicate the single point
  );

  const clockwiseIsPossible = isDirectionPossible({
    path,
    previousPoint,
    newPoint: clockwisePoint,
    pathAsFeature,
  });

  const counterClockwiseIsPossible = isDirectionPossible({
    path,
    previousPoint,
    newPoint: counterClockwisePoint,
    pathAsFeature,
  });

  if (!clockwiseIsPossible && !counterClockwiseIsPossible) {
    return [];
  }

  if (clockwiseIsPossible !== counterClockwiseIsPossible) {
    if (clockwiseIsPossible) {
      return [clockwiseDirection];
    } else {
      return [counterClockwiseDirection];
    }
  }

  const directionsSortedByDistanceFromOrigin =
    sortDirectionsByDistanceFromOrigin({
      clockwisePoint,
      counterClockwisePoint,
      clockwiseDirection,
      counterClockwiseDirection,
    });

  if (directionsSortedByDistanceFromOrigin !== null) {
    return directionsSortedByDistanceFromOrigin;
  }

  return sortDirectionsByBalanceScore({
    previousPoint,
    clockwiseDirection,
    counterClockwiseDirection,
    path,
  });
};

const sortDirectionsByDistanceFromOrigin = ({
  clockwisePoint,
  counterClockwisePoint,
  clockwiseDirection,
  counterClockwiseDirection,
}: {
  clockwisePoint: { x: number; y: number };
  counterClockwisePoint: { x: number; y: number };
  clockwiseDirection: Direction;
  counterClockwiseDirection: Direction;
}) => {
  const clockwiseDistance = getPointDistanceFromOrigin(clockwisePoint);
  const counterClockwiseDistance = getPointDistanceFromOrigin(
    counterClockwisePoint
  );

  if (clockwiseDistance === counterClockwiseDistance) {
    return null;
  }
  return clockwiseDistance < counterClockwiseDistance
    ? [clockwiseDirection, counterClockwiseDirection]
    : [counterClockwiseDirection, clockwiseDirection];
};

const MAXIMUM_LOOP_STEPS = 10000;

export const generateDensePath = (notes: NoteOrBeat[], speed: number) => {
  let path = [
    {
      note: notes[0],
      directionOnHit: { x: speed, y: speed },
      x: 0,
      y: 0,
      duration: notes[0].when,
    },
  ];

  const backtrackingStack: number[] = [];
  let skipFirstDirection = false;

  let loopStepsCount = 0;
  for (let index = 1; index < notes.length; index++) {
    loopStepsCount++;
    if (loopStepsCount > MAXIMUM_LOOP_STEPS) {
      console.error("Reached maximum loop steps on dense path generation", {
        notes,
        speed,
      });
      break;
    }

    const note = notes[index];
    const previousPoint = path.at(-1)!;

    try {
      const duration = note.when - (notes[index - 1]?.when ?? 0);
      const allPossibleDirections = getDirection(
        path.map(({ x, y }) => [x, y]),
        previousPoint.directionOnHit,
        duration
      );

      const possibleDirections = skipFirstDirection
        ? allPossibleDirections.slice(1)
        : allPossibleDirections;
      skipFirstDirection = false;

      if (possibleDirections.length === 0) {
        const lastIndexWithTwoOptions = backtrackingStack.pop();
        if (lastIndexWithTwoOptions === undefined) {
          throw new Error(
            "No path is possible and no last index with two options"
          );
        }

        console.debug(
          "No path is possible, going back to last index with two options",
          { lastIndexWithTwoOptions, index }
        );
        path = path.slice(0, lastIndexWithTwoOptions);
        index = lastIndexWithTwoOptions - 1;
        skipFirstDirection = true;
        continue;
      }

      if (possibleDirections.length > 1) {
        backtrackingStack.push(index);
      }

      const directionOnHit = possibleDirections[0];
      const { x, y } = applyDirectionOnPoint(
        [previousPoint.x, previousPoint.y],
        directionOnHit,
        duration
      );

      path.push({ note, directionOnHit, x, y, duration });
    } catch (e) {
      console.error(e);
      break;
    }
  }

  return getPathWithNewDirections(path);
};

const isDirectionPossible = ({
  path,
  previousPoint,
  newPoint,
  pathAsFeature,
}: {
  path: [number, number][];
  previousPoint: [number, number];
  newPoint: { x: number; y: number };
  pathAsFeature: Feature<LineString>;
}) => {
  const blocksCloseToNewPoint = path.filter((point) => {
    if (point[0] === previousPoint[0] && point[1] === previousPoint[1]) {
      return false;
    }

    // distance from point to line segment from previousPoint to newPoint
    const x1 = previousPoint[0];
    const y1 = previousPoint[1];
    const x2 = newPoint.x;
    const y2 = newPoint.y;
    const x0 = point[0];
    const y0 = point[1];

    // Calculate the parameter t for the projection of point onto the line
    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let distance;
    if (lenSq === 0) {
      // Line segment is actually a point
      distance = Math.hypot(x0 - x1, y0 - y1);
    } else {
      const t = Math.max(0, Math.min(1, dot / lenSq));
      const projX = x1 + t * C;
      const projY = y1 + t * D;
      distance = Math.hypot(x0 - projX, y0 - projY);
    }

    return distance < EPSILON;
  });

  if (blocksCloseToNewPoint.length > 0) {
    return false;
  }

  const newPointIsOnPath = booleanPointOnLine(
    point([newPoint.x, newPoint.y]),
    pathAsFeature,
    { epsilon: EPSILON }
  );
  return !newPointIsOnPath;
};

const sortDirectionsByBalanceScore = ({
  previousPoint,
  clockwiseDirection,
  counterClockwiseDirection,
  path,
}: {
  previousPoint: [number, number];
  clockwiseDirection: Direction;
  counterClockwiseDirection: Direction;
  path: [number, number][];
}) => {
  const isPreviousPointInLeftToRightAxis =
    (previousPoint[0] < 0 && previousPoint[1] < 0) ||
    (previousPoint[0] > 0 && previousPoint[1] > 0);

  const isPointInClockwiseHalf = (point: [number, number]) => {
    if (isPreviousPointInLeftToRightAxis) {
      return (
        (clockwiseDirection.x > 0 && clockwiseDirection.y < 0) ===
        point[1] > -point[0]
      );
    } else {
      return (
        (clockwiseDirection.x > 0 && clockwiseDirection.y > 0) ===
        point[1] < point[0]
      );
    }
  };
  const isPointInCounterClockwiseHalf = (point: [number, number]) => {
    if (isPreviousPointInLeftToRightAxis) {
      return (
        (clockwiseDirection.x > 0 && clockwiseDirection.y < 0) ===
        point[1] < -point[0]
      );
    } else {
      return (
        (clockwiseDirection.x > 0 && clockwiseDirection.y > 0) ===
        point[1] > point[0]
      );
    }
  };

  const stepsInClockwiseDirection = path.filter(isPointInClockwiseHalf).length;
  const stepsInCounterClockwiseDirection = path.filter(
    isPointInCounterClockwiseHalf
  ).length;

  return stepsInClockwiseDirection < stepsInCounterClockwiseDirection
    ? [clockwiseDirection, counterClockwiseDirection]
    : [counterClockwiseDirection, clockwiseDirection];
};

const getPointDistanceFromOrigin = (point: { x: number; y: number }) =>
  Math.hypot(point.x, point.y);

const getPathWithNewDirections = (path: Omit<Step, "newDirection">[]) =>
  path.reduce((acc, step, index) => {
    const newDirection = path[index + 1]?.directionOnHit ?? step.directionOnHit;
    return [...acc, { ...step, newDirection }];
  }, [] as Step[]);

const applyDirectionOnPoint = (
  previousPoint: [number, number],
  direction: { x: number; y: number },
  duration: number
) => ({
  x: previousPoint[0] + direction.x * duration,
  y: previousPoint[1] + direction.y * duration,
});
