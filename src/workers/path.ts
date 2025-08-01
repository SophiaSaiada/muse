import type { Direction, NoteOrBeat, Song, Step } from "../types";

const MIN_INTERVAL_BETWEEN_NOTES = 0.025;

self.onmessage = (e: MessageEvent<string>) => {
  const data = JSON.parse(e.data) as {
    song: Song;
    speed: number;
    lookaheadForCollision: number;
  };

  const path = calculatePath(data.song, data.speed, data.lookaheadForCollision);

  self.postMessage(JSON.stringify(path));
};

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

// TODO: more interesting path generation

const calculatePath = (
  song: Song,
  speed: number,
  lookaheadForCollision: number
) => {
  const notes = getNotes(song);

  let result = generateStraightPath(notes, speed);

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
