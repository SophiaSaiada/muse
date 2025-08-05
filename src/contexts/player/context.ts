import type { MIDIPlayer } from "@/lib/midi/player";
import { createContext } from "react";

export const PlayerContext = createContext<{
  player: MIDIPlayer | null;
  setPlayer: (player: MIDIPlayer | null) => void;
} | null>(null);
