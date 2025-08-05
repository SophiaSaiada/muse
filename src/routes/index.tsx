import { PlayerContext } from "@/contexts/player/context";
import { useRequiredContext } from "@/lib/utils";
import { MainScreen } from "@/screens/main";
import { useEffect } from "react";

export const IndexRoute = () => {
  const { player, setPlayer } = useRequiredContext(PlayerContext);

  useEffect(() => {
    player?.stop().then(() => setPlayer(null));
  }, [player, setPlayer]);

  return <MainScreen />;
};
