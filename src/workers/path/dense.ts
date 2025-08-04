import type { Feature, LineString } from "geojson";
import type { Direction, NoteOrBeat, Step } from "../../types";
import { lineString, booleanPointOnLine, point } from "@turf/turf";

const rotateDirectionClockwise = (direction: Direction) => {
  if (direction.x > 0 && direction.y > 0) {
    return {
      x: -direction.x,
      y: direction.y,
    };
  }
  if (direction.x > 0 && direction.y < 0) {
    return {
      x: direction.x,
      y: -direction.y,
    };
  }

  if (direction.x < 0 && direction.y < 0) {
    return {
      x: -direction.x,
      y: direction.y,
    };
  }

  // if (direction.x < 0 && direction.y > 0) {
  return {
    x: direction.x,
    y: -direction.y,
  };
};

const rotateDirectionCounterClockwise = (direction: Direction) => {
  if (direction.x > 0 && direction.y > 0) {
    return {
      x: direction.x,
      y: -direction.y,
    };
  }
  if (direction.x > 0 && direction.y < 0) {
    return {
      x: -direction.x,
      y: direction.y,
    };
  }

  if (direction.x < 0 && direction.y < 0) {
    return {
      x: direction.x,
      y: -direction.y,
    };
  }

  // if (direction.x < 0 && direction.y > 0) {
  return {
    x: -direction.x,
    y: direction.y,
  };
};

const EPSILON = 20;

// TODO: fix point not colliding with block at 1:31
const getDirection = (
  path: [number, number][],
  lastChosenDirection: Direction,
  duration: number
) => {
  const clockwiseDirection = rotateDirectionClockwise(lastChosenDirection);
  const counterClockwiseDirection =
    rotateDirectionCounterClockwise(lastChosenDirection);

  const previousPoint = path.at(-1)!;

  const clockwisePoint = {
    x: previousPoint[0] + clockwiseDirection.x * duration,
    y: previousPoint[1] + clockwiseDirection.y * duration,
  };

  const counterClockwisePoint = {
    x: previousPoint[0] + counterClockwiseDirection.x * duration,
    y: previousPoint[1] + counterClockwiseDirection.y * duration,
  };

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

  const clockwiseDistance = getPointDistanceFromOrigin(clockwisePoint);
  const counterClockwiseDistance = getPointDistanceFromOrigin(
    counterClockwisePoint
  );

  if (clockwiseDistance !== counterClockwiseDistance) {
    return clockwiseDistance < counterClockwiseDistance
      ? [clockwiseDirection, counterClockwiseDirection]
      : [counterClockwiseDirection, clockwiseDirection];
  }

  return getDirectionsWhenBothPointsAreCloseToOrigin({
    previousPoint,
    clockwiseDirection,
    counterClockwiseDirection,
    path,
  });
};

const MAXIMUM_LOOP_STEPS = 10000;

// TODO: refactor
export const generateDensePath = (notes: NoteOrBeat[], speed: number) => {
  let path: Omit<Step, "newDirection">[] = [
    {
      x: 0,
      y: 0,
      note: notes[0],
      duration: notes[0].when,
      directionOnHit: { x: speed, y: speed },
    },
  ];
  let preferOtherDirection = false;

  const backtrackingStack: number[] = [];

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
      const possibleDirections = getDirection(
        path.map(({ x, y }) => [x, y]),
        previousPoint.directionOnHit,
        duration
      );
      if (possibleDirections.length === 0) {
        if (backtrackingStack.length === 0) {
          throw new Error(
            "No path is possible and no last index with two options"
          );
        }
        const lastIndexWithTwoOptions = backtrackingStack.pop()!;
        console.log(
          "No path is possible, going back to last index with two options",
          {
            lastIndexWithTwoOptions,
            index,
          }
        );
        index = lastIndexWithTwoOptions - 1;
        preferOtherDirection = true;
        path = path.slice(0, lastIndexWithTwoOptions);
        continue;
      }
      if (possibleDirections.length > 1 && !preferOtherDirection) {
        backtrackingStack.push(index);
      }

      const newDirection = possibleDirections[preferOtherDirection ? 1 : 0];
      preferOtherDirection = false;
      const x = previousPoint.x + newDirection.x * duration;
      const y = previousPoint.y + newDirection.y * duration;

      path.push({
        note: notes[index],
        directionOnHit: newDirection,
        x,
        y,
        duration: notes[index].when - (notes[index - 1]?.when ?? 0),
      });
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

const getDirectionsWhenBothPointsAreCloseToOrigin = ({
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
