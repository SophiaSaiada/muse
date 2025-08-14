import { Game as MainGame } from "./scenes/Game";
import { AUTO, Game } from "phaser";

const defaultConfig: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  scene: [MainGame],
};

const StartGame = (
  parent: string,
  config: Partial<Phaser.Types.Core.GameConfig> = {}
) => {
  return new Game({ ...defaultConfig, ...config, parent });
};

export default StartGame;
