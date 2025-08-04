import type { Direction, NoteOrBeat, Step } from "../../types";

const LOOKAHEAD_FOR_COLLISION = 14;

const generateStraightPath = (notes: NoteOrBeat[], speed: number) =>
  notes.reduce<{
    path: Step[];
    direction: Direction;
  }>(
    (acc, note) => {
      const newDirection = {
        x: acc.direction.x,
        y: acc.direction.y * -1,
      };

      const previousPoint = acc.path.at(-1);
      if (!previousPoint) {
        return {
          path: [
            {
              note,
              x: 0,
              y: 0,
              directionOnHit: acc.direction,
              newDirection,
              duration: note.when,
            },
          ],
          direction: newDirection,
        };
      }

      const duration = note.when - previousPoint.note.when;
      const x = previousPoint.x + acc.direction.x * duration;
      const y = previousPoint.y + acc.direction.y * duration;

      return {
        path: [
          ...acc.path,
          {
            note,
            directionOnHit: acc.direction,
            x,
            y,
            duration,
            newDirection,
          },
        ],
        direction: newDirection,
      };
    },
    { path: [], direction: { x: speed, y: -speed } }
  ).path;

export const generateSparsePath = (notes: NoteOrBeat[], speed: number) => {
  let result = generateStraightPath(notes, speed);

  let lastBendIndex: number | null = null;

  for (
    let index = result.length - 1 - LOOKAHEAD_FOR_COLLISION;
    LOOKAHEAD_FOR_COLLISION <= index;
    index--
  ) {
    if (lastBendIndex && index > lastBendIndex - LOOKAHEAD_FOR_COLLISION) {
      continue;
    }

    const straightPathBounds = calculateBounds(
      result.slice(index - LOOKAHEAD_FOR_COLLISION, index)
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
