import type { Direction, NoteOrBeat, Song, Step } from "../types";
import type * as turfForTyping from "@turf/turf";
declare global {
  const turf: typeof turfForTyping;
}

const MIN_INTERVAL_BETWEEN_NOTES = 0.1;

importScripts("https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/turf.min.js");

self.onmessage = (e: MessageEvent<string>) => {
  const data = JSON.parse(e.data) as {
    song: Song;
    speed: number;
  };

  const notes = getNotes(data.song);
  const path = calculatePath(notes, data.speed);

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

const EPSILON = 20;

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

const calculatePath = (notes: NoteOrBeat[], speed: number) => {
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

  const backtrackingStack: number[] = []; // TODO: improve backtracking

  let steps = 0;
  for (let index = 1; index < notes.length; index++) {
    steps++;
    if (steps > 10000) {
      // TODO: detect infinite loop
      console.log("✨ ~ generateStraightPath ~ steps:", steps);
      break;
    }
    console.log("✨ ~ generateStraightPath ~ index:", index);
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
      console.log(
        "✨ ~ generateStraightPath ~ possibleDirections:",
        index,
        possibleDirections,
        preferOtherDirection
      );
      preferOtherDirection = false;
      const x = previousPoint.x + newDirection.x * duration;
      const y = previousPoint.y + newDirection.y * duration;
      console.log("✨ ~ generateStraightPath ~ direction:", {
        index,
        direction: newDirection,
        previousPoint,
        duration,
        dX: newDirection.x * duration,
        dY: newDirection.y * duration,
        x,
        y,
      });

      path.push({
        note: notes[index],
        directionOnHit: newDirection, // TODO: fix this, it shows wrong
        x,
        y,
        duration: notes[index].when - (notes[index - 1]?.when ?? 0),
      });
    } catch (e) {
      console.error(e);
      break;
    }
  }

  return path.reduce((acc, step, index) => {
    return [
      ...acc,
      {
        ...step,
        newDirection: path[index + 1]?.directionOnHit ?? step.directionOnHit,
      },
    ];
  }, [] as Step[]);
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
