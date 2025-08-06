import type { Direction, NoteOrBeat, Step } from "../../types";

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

const LOG_INDEXES = [] as number[];

const MINIMUM_DISTANCE_BETWEEN_PATH_AND_BLOCK = 20;

const getDirection = (
  path: [number, number][],
  lastChosenDirection: Direction,
  duration: number
) => {
  const shouldLog = LOG_INDEXES.includes(path.length);

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

  const clockwiseIsPossible = isDirectionPossible({
    path,
    previousPoint,
    newPoint: clockwisePoint,
    shouldLog,
  });

  const counterClockwiseIsPossible = isDirectionPossible({
    path,
    previousPoint,
    newPoint: counterClockwisePoint,
    shouldLog,
  });

  if (shouldLog) {
    console.log("clockwiseIsPossible", {
      index: path.length,
      clockwiseIsPossible,
      counterClockwiseIsPossible,
      clockwisePoint,
      counterClockwisePoint,
      clockwiseDirection,
      counterClockwiseDirection,
      path,
      previousPoint,
    });
  }

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
          console.error(
            "No path is possible and no last index with two options",
            {
              notes,
              speed,
              path,
              index,
            }
          );
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

  if (LOG_INDEXES.length) {
    console.log("Completed dense path generation", {
      notes,
      speed,
      path,
    });
  }

  return {
    path: getPathWithNewDirections(path),
    denseRegion: findDenseRegion(path),
  };
};

const getDistanceOfPointFromSegment = ({
  point,
  segmentStart,
  segmentEnd,
}: {
  point: [number, number];
  segmentStart: [number, number];
  segmentEnd: [number, number];
}) => {
  // Explanation: https://stackoverflow.com/a/6853926
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;
  const [x0, y0] = point;

  const A = x0 - x1;
  const B = y0 - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  const t = Math.max(0, Math.min(1, dot / lenSq));
  const projX = x1 + t * C;
  const projY = y1 + t * D;
  return Math.hypot(x0 - projX, y0 - projY);
};

const isPointOnPath = (
  point: [number, number],
  path: [number, number][],
  maxDistance: number
) =>
  path.some(
    (pointOnPath, index) =>
      index !== 0 &&
      getDistanceOfPointFromSegment({
        point,
        segmentStart: path[index - 1],
        segmentEnd: pointOnPath,
      }) < maxDistance
  );

const isDirectionPossible = ({
  path,
  previousPoint,
  newPoint,
  shouldLog,
}: {
  path: [number, number][];
  previousPoint: [number, number];
  newPoint: { x: number; y: number };
  shouldLog: boolean;
}) => {
  const blocksCloseToNewPoint = path.filter((point) => {
    if (point[0] === previousPoint[0] && point[1] === previousPoint[1]) {
      return false;
    }

    // Explanation: https://stackoverflow.com/a/6853926
    const [x1, y1] = previousPoint;
    const { x: x2, y: y2 } = newPoint;
    const [x0, y0] = point;

    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    const t = Math.max(0, Math.min(1, dot / lenSq));
    const projX = x1 + t * C;
    const projY = y1 + t * D;
    const distance = Math.hypot(x0 - projX, y0 - projY);

    return distance < MINIMUM_DISTANCE_BETWEEN_PATH_AND_BLOCK;
  });

  if (shouldLog) {
    console.log("blocksCloseToNewPoint", {
      blocksCloseToNewPoint,
      newPoint,
      previousPoint,
      path,
    });
  }
  if (blocksCloseToNewPoint.length > 0) {
    return false;
  }

  const newPointIsOnPath = isPointOnPath(
    [newPoint.x, newPoint.y],
    path,
    MINIMUM_DISTANCE_BETWEEN_PATH_AND_BLOCK
  );

  if (shouldLog) {
    console.log("newPointIsOnPath", {
      newPointIsOnPath,
      newPoint,
      path,
    });
  }

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

// TODO: refactor
const findDenseRegion = (path: Omit<Step, "newDirection">[]) => {
  const minX = Math.min(...path.map(({ x }) => x));
  const minY = Math.min(...path.map(({ y }) => y));
  const maxX = Math.max(...path.map(({ x }) => x));
  const maxY = Math.max(...path.map(({ y }) => y));

  const gridSize = 50;

  // Create a 2D grid to count steps in each cell
  const grid: number[][] = Array(gridSize)
    .fill(0)
    .map(() => Array(gridSize).fill(0));

  // Find the center grid position (where 0,0 is mapped)
  const centerGridX = Math.floor(((0 - minX) / (maxX - minX)) * (gridSize - 1));
  const centerGridY = Math.floor(((0 - minY) / (maxY - minY)) * (gridSize - 1));

  path.forEach((step) => {
    const gridX = Math.floor(
      ((step.x - minX) / (maxX - minX)) * (gridSize - 1)
    );
    const gridY = Math.floor(
      ((step.y - minY) / (maxY - minY)) * (gridSize - 1)
    );
    const clampedX = Math.max(0, Math.min(gridSize - 1, gridX));
    const clampedY = Math.max(0, Math.min(gridSize - 1, gridY));
    grid[clampedY][clampedX]++;
  });

  // Find a large square that captures the main distribution
  // Just expand until we get most points, don't be too conservative
  let bestRadius = 1;
  const totalSteps = path.length;

  for (let radius = 1; radius < Math.min(gridSize / 2, 35); radius++) {
    const minX = Math.max(0, centerGridX - radius);
    const maxX = Math.min(gridSize - 1, centerGridX + radius);
    const minY = Math.max(0, centerGridY - radius);
    const maxY = Math.min(gridSize - 1, centerGridY + radius);

    // Count points in this square
    let pointsInSquare = 0;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        pointsInSquare += grid[y][x];
      }
    }

    const coverage = pointsInSquare / totalSteps;

    // Keep expanding until we capture most points (85%+) or hit diminishing returns
    if (coverage >= 0.85) {
      bestRadius = radius;
    } else if (coverage >= 0.75) {
      bestRadius = radius; // Keep this as backup
    }

    // Continue expanding unless we've captured 90%+ or hit boundaries
    if (coverage >= 0.9) {
      break;
    }
  }

  const finalMinX = Math.max(0, centerGridX - bestRadius);
  const finalMaxX = Math.min(gridSize - 1, centerGridX + bestRadius);
  const finalMinY = Math.max(0, centerGridY - bestRadius);
  const finalMaxY = Math.min(gridSize - 1, centerGridY + bestRadius);

  const cellWidth = (maxX - minX) / gridSize;
  const cellHeight = (maxY - minY) / gridSize;

  return {
    startX: minX + finalMinX * cellWidth,
    startY: minY + finalMinY * cellHeight,
    endX: minX + (finalMaxX + 1) * cellWidth,
    endY: minY + (finalMaxY + 1) * cellHeight,
  };
};
