export type Note = { when: number };

type Direction = { x: number; y: number };

export type Step = {
  note: Note;
  x: number;
  y: number;
  directionOnHit: { x: number; y: number };
  blockLocation: { x: number; y: number };
};

export const calculatePath = (notes: Note[], blockSize: number) =>
  notes.reduce<{
    path: Step[];
    direction: Direction;
  }>(
    (acc, note, index) => {
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
            },
          ],
          direction: acc.direction,
        };
      }

      const duration = note.when - previousPoint.note.when;
      const x = previousPoint.x + acc.direction.x * duration;
      const y = previousPoint.y + acc.direction.y * duration;

      const shouldChangeXDirection = index % 40 < 20 || Math.random() <= 0.01; // TODO: eliminate repetitive direction, improve sparsity

      return {
        path: [
          ...acc.path,
          {
            note,
            directionOnHit: acc.direction,
            blockLocation: !shouldChangeXDirection
              ? {
                  x,
                  y: y + blockSize * (acc.direction.y < 0 ? -1 : 1),
                }
              : {
                  x: x + blockSize * (acc.direction.x < 0 ? -1 : 1),
                  y,
                },
            x,
            y,
          },
        ],
        direction: {
          x: shouldChangeXDirection ? acc.direction.x * -1 : acc.direction.x,
          y: shouldChangeXDirection ? acc.direction.y : acc.direction.y * -1,
        },
      };
    },
    { path: [], direction: { x: 353, y: 337 } } // Hypothesis: prime numbers are good to prevent collisions
  ).path;
