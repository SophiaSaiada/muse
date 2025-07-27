export type Note = { when: number };

type Direction = { x: number; y: number };

export type Step = {
  note: Note;
  x: number;
  duration: number;
  y: number;
  directionOnHit: Direction;
  newDirection: Direction;
};

const generateStraightPath = (notes: Note[], speed: number) =>
  notes.reduce<{
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
              newDirection: acc.direction,
              duration: note.when,
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
            duration,
            newDirection,
          },
        ],
        direction: newDirection,
      };
    },
    { path: [], direction: { x: speed, y: speed } }
  ).path;

export const calculatePath = (notes: Note[], speed: number) => {
  const straightPath = generateStraightPath(notes, speed);

  const bendPoints = [
    { index: 20 },
    { index: 51 },
    { index: 100 },
    { index: 151 },
    { index: 240 },
    { index: 331 },
    { index: 450 },
    { index: 601 },
  ];

  return bendPoints.reduce(
    (acc, { index }) => bendPath(acc, index),
    straightPath
  );
};

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
