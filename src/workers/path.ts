import type { Direction, NoteOrBeat, Song, Step } from "../types";
import type * as turfForTyping from "@turf/turf";
declare global {
  const turf: typeof turfForTyping;
}

const MIN_INTERVAL_BETWEEN_NOTES = 0.025;

importScripts("https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/turf.min.js");

self.onmessage = (e: MessageEvent<string>) => {
  const data = JSON.parse(e.data) as {
    song: Song;
    speed: number;
    lookaheadForCollision: number;
  };

  const path = calculatePath(data.song, data.speed, data.lookaheadForCollision);

  self.postMessage(JSON.stringify(path));
};

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

const EPSILON = 12;

const getDirection = (
  path: [number, number][],
  lastNewDirection: Direction,
  duration: number
) => {
  const clockwiseDirection = rotateDirectionClockwise(lastNewDirection);
  const counterClockwiseDirection =
    rotateDirectionCounterClockwise(lastNewDirection);

  const previousPoint = path.at(-1)!;

  const clockwisePoint = {
    x: previousPoint[0] + clockwiseDirection.x * duration,
    y: previousPoint[1] + clockwiseDirection.y * duration,
  };

  const counterClockwisePoint = {
    x: previousPoint[0] + counterClockwiseDirection.x * duration,
    y: previousPoint[1] + counterClockwiseDirection.y * duration,
  };

  const pathAsFeature = turf.lineString(
    path.length === 13
      ? path.slice(9)
      : path.length > 1
      ? path
      : [
          [0, 0],
          [0, 0],
        ]
  );

  const blocksCloseToClockwisePoint = path.filter((point) => {
    if (point[0] === previousPoint[0] && point[1] === previousPoint[1]) {
      return false;
    }

    // distance from point to line segment from previousPoint to clockwisePoint
    const x1 = previousPoint[0];
    const y1 = previousPoint[1];
    const x2 = clockwisePoint.x;
    const y2 = clockwisePoint.y;
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

  const clockwisePointIsOnPath = turf.booleanPointOnLine(
    turf.point([clockwisePoint.x, clockwisePoint.y]),
    pathAsFeature,
    { epsilon: EPSILON }
  );
  const clockwiseIsPossible =
    blocksCloseToClockwisePoint.length === 0 && !clockwisePointIsOnPath;

  // check if there is any point on counterClockwiseNewSegment that is close (within 1) to any point in path
  const blocksCloseToCounterClockwisePoint = path
    .map((point) => {
      // distance from point to line segment from previousPoint to counterClockwisePoint
      const x1 = previousPoint[0];
      const y1 = previousPoint[1];
      const x2 = counterClockwisePoint.x;
      const y2 = counterClockwisePoint.y;
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

      return {
        point,
        distance,
      };
    })
    .filter(({ point, distance }) => {
      return (
        !(point[0] === previousPoint[0] && point[1] === previousPoint[1]) &&
        distance < EPSILON
      );
    });

  const counterClockwisePointIsOnPath = turf.booleanPointOnLine(
    turf.point([counterClockwisePoint.x, counterClockwisePoint.y]),
    pathAsFeature,
    { epsilon: EPSILON }
  );
  const counterClockwiseIsPossible =
    blocksCloseToCounterClockwisePoint.length === 0 &&
    !counterClockwisePointIsOnPath;

  if (!clockwiseIsPossible && !counterClockwiseIsPossible) {
    console.log("No path is possible", {
      index: path.length,
      path,
      previousPoint,
      blocksCloseToClockwisePoint,
      blocksCloseToCounterClockwisePoint,
      counterClockwiseDirection,
      counterClockwisePoint,
      clockwiseDirection,
      clockwisePoint,
      clockwisePointIsOnPath,
      counterClockwisePointIsOnPath,
      pathAsFeature,
    });
    return [];
  }

  if (clockwiseIsPossible !== counterClockwiseIsPossible) {
    if (clockwiseIsPossible) {
      return [clockwiseDirection];
    } else {
      return [counterClockwiseDirection];
    }
  }

  const clockwiseDistance = Math.hypot(clockwisePoint.x, clockwisePoint.y);

  const counterClockwiseDistance = Math.hypot(
    counterClockwisePoint.x,
    counterClockwisePoint.y
  );

  if (clockwiseDistance !== counterClockwiseDistance) {
    return clockwiseDistance < counterClockwiseDistance
      ? [clockwiseDirection, counterClockwiseDirection]
      : [counterClockwiseDirection, clockwiseDirection];
  }

  if (
    (previousPoint[0] < 0 && previousPoint[1] < 0) ||
    (previousPoint[0] > 0 && previousPoint[1] > 0)
  ) {
    if (clockwiseDirection.x > 0 && clockwiseDirection.y < 0) {
      const stepsInClockwiseDirection = path.filter(
        (point) => point[1] > -point[0]
      ).length;
      const stepsInCounterClockwiseDirection = path.filter(
        (point) => point[1] < -point[0]
      ).length;

      return stepsInClockwiseDirection < stepsInCounterClockwiseDirection
        ? [clockwiseDirection, counterClockwiseDirection]
        : [counterClockwiseDirection, clockwiseDirection];
    } else {
      const stepsInClockwiseDirection = path.filter(
        (point) => point[1] < -point[0]
      ).length;
      const stepsInCounterClockwiseDirection = path.filter(
        (point) => point[1] > -point[0]
      ).length;

      return stepsInClockwiseDirection < stepsInCounterClockwiseDirection
        ? [clockwiseDirection, counterClockwiseDirection]
        : [counterClockwiseDirection, clockwiseDirection];
    }
  } else {
    if (clockwiseDirection.x > 0 && clockwiseDirection.y > 0) {
      const stepsInClockwiseDirection = path.filter(
        (point) => point[1] < point[0]
      ).length;
      const stepsInCounterClockwiseDirection = path.filter(
        (point) => point[1] > point[0]
      ).length;

      return stepsInClockwiseDirection < stepsInCounterClockwiseDirection
        ? [clockwiseDirection, counterClockwiseDirection]
        : [counterClockwiseDirection, clockwiseDirection];
    } else {
      const stepsInClockwiseDirection = path.filter(
        (point) => point[1] > point[0]
      ).length;
      const stepsInCounterClockwiseDirection = path.filter(
        (point) => point[1] < point[0]
      ).length;

      return stepsInClockwiseDirection < stepsInCounterClockwiseDirection
        ? [clockwiseDirection, counterClockwiseDirection]
        : [counterClockwiseDirection, clockwiseDirection];
    }
  }
};

const generateStraightPath = (
  notes: NoteOrBeat[],
  speed: number,
  path: Step[] = [
    {
      x: 0,
      y: 0,
      newDirection: { x: speed, y: speed },
      directionOnHit: { x: speed, y: speed },
      note: notes[0],
      duration: notes[0].when,
    },
  ],
  index: number = 1
) => {
  console.log("✨ ~ generateStraightPath ~ index:", index);
  if (index > notes.length) {
    return path;
  }

  const note = notes[index];
  const previousPoint = path.at(-1)!;
  const duration = note.when - (previousPoint.note?.when ?? 0);

  const possibleDirections = getDirection(
    path.map(({ x, y }) => [x, y]),
    previousPoint.newDirection,
    duration
  );
  if (possibleDirections.length === 0) {
    throw new Error("No path is possible");
  }

  try {
    const firstOption = possibleDirections[0];
    return generateStraightPath(
      notes,
      speed,
      [
        ...path,
        {
          note,
          duration,
          x: previousPoint.x + firstOption.x * duration,
          y: previousPoint.y + firstOption.y * duration,
          directionOnHit: previousPoint.newDirection,
          newDirection: firstOption,
        },
      ],
      index + 1
    );
  } catch (e) {
    if (possibleDirections.length === 1) {
      throw e;
    }
    const secondOption = possibleDirections[1];
    return generateStraightPath(
      notes,
      speed,
      [
        ...path,
        {
          note,
          duration,
          x: previousPoint.x + secondOption.x * duration,
          y: previousPoint.y + secondOption.y * duration,
          directionOnHit: previousPoint.newDirection,
          newDirection: secondOption,
        },
      ],
      index + 1
    );
  }
};

// TODO: more interesting path generation

const calculatePath = (
  song: Song,
  speed: number,
  lookaheadForCollision: number
) => {
  const notes = getNotes(song);

  let result = generateStraightPath(notes, speed);
  return result;
  let lastBendIndex: number | null = null;

  for (
    let index = result.length - 1 - lookaheadForCollision;
    lookaheadForCollision <= index;
    index--
  ) {
    if (lastBendIndex && index > lastBendIndex - lookaheadForCollision) {
      continue;
    }

    const straightPathBounds = calculateBounds(
      result.slice(index - lookaheadForCollision, index)
    );

    const spiralBounds = calculateBounds(result.slice(index));
    const predictedToCollide = doesBoundIntersect(
      straightPathBounds,
      spiralBounds
    );

    const spiralBoundsAfterBending = calculateBounds(
      bendPath(result.slice(index - 1), 1).slice(1)
    );
    const wontCollideAfterBending = !doesBoundIntersect(
      straightPathBounds,
      spiralBoundsAfterBending
    );

    if (predictedToCollide || wontCollideAfterBending) {
      result = bendPath(result, index);
      lastBendIndex = index;
    }
  }

  return result;
};

const calculateBounds = (path: Step[]) => {
  const xs = path.map(({ x }) => x);
  const ys = path.map(({ y }) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const doesBoundIntersect = (
  spiral: { minX: number; maxX: number; minY: number; maxY: number },
  newlyBent: { minX: number; maxX: number; minY: number; maxY: number }
) =>
  spiral.minX <= newlyBent.maxX &&
  spiral.maxX >= newlyBent.minX &&
  spiral.minY <= newlyBent.maxY &&
  spiral.maxY >= newlyBent.minY;

const bendPath = (path: Step[], index: number) =>
  path.reduce((acc, step, i) => {
    if (i < index) {
      return [...acc, step];
    }

    return [...acc, bendPoint(step, acc.at(-1)!)];
  }, [] as Step[]);

const bendPoint = (step: Step, previousStep: Step): Step => {
  const directionOnHit = previousStep.newDirection;

  const changeWasFormerlyOnXAxis =
    step.directionOnHit.x !== step.newDirection.x;

  const newDirection = changeWasFormerlyOnXAxis
    ? {
        x: directionOnHit.x,
        y: -directionOnHit.y,
      }
    : {
        x: -directionOnHit.x,
        y: directionOnHit.y,
      };

  return {
    ...step,
    x: previousStep.x + directionOnHit.x * step.duration,
    y: previousStep.y + directionOnHit.y * step.duration,
    directionOnHit,
    newDirection,
  };
};

const getNotes = (song: Song) => {
  const notes = [
    ...song.tracks.flatMap((track) => track.notes),
    ...song.beats.flatMap((track) => track.notes),
  ];
  notes.sort((a, b) => a.when - b.when);

  return notes.reduce<NoteOrBeat[]>((acc, note) => {
    const previousNote = acc.at(-1);
    if (
      previousNote &&
      note.when - previousNote.when < MIN_INTERVAL_BETWEEN_NOTES
    ) {
      return acc;
    }

    return [...acc, note];
  }, []);
};
