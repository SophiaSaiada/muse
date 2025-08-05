import { useState } from "react";
import type { MIDIPlayer } from "@/lib/midi/player";
import { PlayerContext } from "@/contexts/player/context";

export const PlayerContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [player, setPlayer] = useState<MIDIPlayer | null>(null);

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};
