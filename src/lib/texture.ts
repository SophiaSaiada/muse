import { type Texture, TextureLoader } from "three";

export type Textures = {
  ball: {
    map: Texture;
    displacementMap: Texture;
  };
};

const TEXTURES_BASE_PATH = "/textures/";

export const loadTextures = async (): Promise<Textures> => {
  const [ballMap, ballDisplacementMap] = await Promise.all([
    new TextureLoader().loadAsync(`${TEXTURES_BASE_PATH}crystal/color.jpg`),
    new TextureLoader().loadAsync(
      `${TEXTURES_BASE_PATH}crystal/displacement.png`
    ),
  ]);
  return { ball: { map: ballMap, displacementMap: ballDisplacementMap } };
};
