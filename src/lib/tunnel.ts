import type { Step } from "./path";

export const calculateTunnelPoints = (
  path: Step[]
): { x: number; y: number }[] => {
  const result = [];
  const alreadyAddedIndexes = new Set<number>();

  for (let i = 0; i < path.length; ) {
    const step = path[i];
    const nextStep = path.at(i + 1);
    const nextNextStep = path.at(i + 2);

    const isOneStepBeforeBendPoint =
      nextStep &&
      nextStep.newDirection.x === -1 * step.directionOnHit.x &&
      nextStep.newDirection.y === -1 * step.directionOnHit.y;

    const isTwoStepBeforeBendPoint =
      nextNextStep &&
      nextNextStep.newDirection.x === -1 * step.newDirection.x &&
      nextNextStep.newDirection.y === -1 * step.newDirection.y;

    result.push(step);
    alreadyAddedIndexes.add(i);

    if (isOneStepBeforeBendPoint) {
      i += 1;
    } else if (isTwoStepBeforeBendPoint) {
      i += 3;
    } else {
      i += 2;
    }
  }

  result.push(
    getComplementaryMiddleStep(path[path.length - 1], path[path.length - 2])
  );

  for (let i = path.length - 1; i >= 0; i--) {
    const step = path[i];

    if (alreadyAddedIndexes.has(i)) {
      continue;
    }
    result.push(step);
    alreadyAddedIndexes.add(i);
  }

  result.push(getComplementaryEndStep(path[0], path[1]));

  return result;
};

const getComplementaryMiddleStep = (lastStep: Step, previousStep: Step) => {
  if (lastStep.directionOnHit.x === -1 * lastStep.newDirection.x) {
    return { x: previousStep.x, y: lastStep.y };
  }
  return { x: lastStep.x, y: previousStep.y };
};

const getComplementaryEndStep = (lastStep: Step, previousStep: Step) => {
  if (lastStep.directionOnHit.x === -1 * lastStep.newDirection.x) {
    return { x: previousStep.x, y: lastStep.y };
  }
  return { x: lastStep.x, y: previousStep.y };
};
