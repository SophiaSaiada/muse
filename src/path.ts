export type Note = { when: number };

type Direction = { x: number; y: number };

export type Step = {
  note: Note;
  x: number;
  y: number;
  directionOnHit: Direction;
  newDirection: Direction;
};

export const calculatePath = (notes: Note[], speed: number) => {
  const straightPath = notes.reduce<{
    path: Step[];
    direction: Direction;
  }>(
    (acc, note) => {
      const previousPoint = acc.path.at(-1);
      if (previousPoint?.note.when === note.when) {
        return acc;
      }

      if (!previousPoint) {
        return {
          path: [
            {
              note,
              x: 0,
              y: 0,
              directionOnHit: acc.direction,
              blockLocation: { x: 0, y: 0 },
              newDirection: acc.direction,
            },
          ],
          direction: acc.direction,
        };
      }

      const duration = note.when - previousPoint.note.when;
      const x = previousPoint.x + acc.direction.x * duration;
      const y = previousPoint.y + acc.direction.y * duration;

      const newDirection = {
        x: acc.direction.x,
        y: acc.direction.y * -1,
      };

      return {
        path: [
          ...acc.path,
          {
            note,
            directionOnHit: acc.direction,
            x,
            y,
            newDirection,
          },
        ],
        direction: newDirection,
      };
    },
    { path: [], direction: { x: speed, y: speed } }
  ).path;

  const bendPoints = [
    { index: 5, counterClockwise: true },
    { index: 10, counterClockwise: false },
    { index: 20, counterClockwise: true },
    { index: 35, counterClockwise: false },
    { index: 55, counterClockwise: true },
    { index: 75, counterClockwise: false },
    { index: 100, counterClockwise: true },
    { index: 135, counterClockwise: false },
    { index: 155, counterClockwise: true },
    { index: 210, counterClockwise: false },
  ];

  return bendPoints.reduce(
    (acc, { index, counterClockwise }) =>
      bendPath(acc, index, counterClockwise),
    straightPath
  );
};

const bendPath = (
  path: Step[],
  index: number,
  counterClockwise: boolean = false
) => {
  const bendStep = path[index];

  return path.map((step, i) => {
    if (i < index) {
      return step;
    }

    const rotatedX = bendStep.x + (step.y - bendStep.y);
    const rotatedY =
      bendStep.y -
      (counterClockwise ? bendStep.x - step.x : step.x - bendStep.x);

    const flippedHorizontallyX = 2 * bendStep.x - rotatedX;

    return {
      ...step,
      x: counterClockwise ? rotatedX : flippedHorizontallyX,
      y: rotatedY,
      directionOnHit:
        i === index
          ? step.directionOnHit
          : getRotatedFlippedDirection(step.directionOnHit, counterClockwise),
      newDirection: getRotatedFlippedDirection(
        step.newDirection,
        counterClockwise
      ),
    };
  });
};

const getRotatedFlippedDirection = (
  direction: Direction,
  counterClockwise: boolean
) => {
  const rotatedDirection = {
    x: direction.y,
    y: direction.x,
  };

  const flippedDirection = counterClockwise
    ? rotatedDirection
    : {
        x: -rotatedDirection.x,
        y: -rotatedDirection.y,
      };

  return flippedDirection;
};
