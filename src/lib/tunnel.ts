import { BLOCK_HEIGHT, BLOCK_WIDTH } from "../constants";
import type { Step } from "./path";

export const calculateTunnelPoints = (
  path: Step[]
): { x: number; y: number }[] => {
  const result: { x: number; y: number }[] = [];
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

    result.push(...getStepPointsToResult(step));

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
    result.push(...getStepPointsToResult(step, true));

    alreadyAddedIndexes.add(i);
  }

  result.push(getComplementaryEndStep(path[0], path[1]));

  return result;
};

const getComplementaryMiddleStep = (lastStep: Step, previousStep: Step) => {
  if (lastStep.directionOnHit.x === -1 * lastStep.newDirection.x) {
    return {
      x: getStepPointsToResult(previousStep)[1].x,
      y: getStepPointsToResult(lastStep, true)[0].y,
    };
  }

  return {
    x: getStepPointsToResult(lastStep, true)[0].x,
    y: getStepPointsToResult(previousStep)[1].y,
  };
};

const getComplementaryEndStep = (firstStep: Step, secondStep: Step) => {
  if (firstStep.directionOnHit.x === -1 * firstStep.newDirection.x) {
    return {
      x: getStepPointsToResult(secondStep, true)[1].x,
      y: getStepPointsToResult(firstStep)[0].y,
    };
  }

  return {
    x: getStepPointsToResult(firstStep)[0].x,
    y: getStepPointsToResult(secondStep, true)[1].y,
  };
};

// TODO: bezier curve
function getStepPointsToResult(step: Step, reversed: boolean = false) {
  if (step.newDirection.x === step.directionOnHit.x) {
    const y = getYOfStepInXAxis(step, BLOCK_HEIGHT);
    const firstPoint = { x: step.x - BLOCK_WIDTH * 0.5, y };
    const secondPoint = { x: step.x + BLOCK_WIDTH * 0.5, y };

    if (
      (!reversed && step.directionOnHit.x > 0) ||
      (reversed && step.directionOnHit.x < 0)
    ) {
      return [firstPoint, secondPoint];
    }

    return [secondPoint, firstPoint];
  }

  const x = getXOfStepInYAxis(step, BLOCK_HEIGHT);
  const firstPoint = { x, y: step.y - BLOCK_WIDTH * 0.5 };
  const secondPoint = { x, y: step.y + BLOCK_WIDTH * 0.5 };

  if (
    (!reversed && step.directionOnHit.y > 0) ||
    (reversed && step.directionOnHit.y < 0)
  ) {
    return [firstPoint, secondPoint];
  }

  return [secondPoint, firstPoint];
}

export const getYOfStepInXAxis = (
  { directionOnHit, y }: Pick<Step, "directionOnHit" | "y">,
  pointScale: number
) => y + pointScale * (directionOnHit.y > 0 ? 0.5 : -0.5);

export const getXOfStepInYAxis = (
  { directionOnHit, x }: Pick<Step, "directionOnHit" | "x">,
  pointScale: number
) => x + pointScale * (directionOnHit.x > 0 ? 0.5 : -0.5);
