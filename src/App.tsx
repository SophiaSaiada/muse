import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { MIDIPlayer } from "@/lib/midi/player";
import { MIDIFile } from "@/lib/midi/file";
import { calculatePath } from "@/lib/path";
import {
  INCLUDE_BEATS,
  MUTE,
  INITIAL_VIZ_TYPE,
  SPEED,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import { Viz } from "@/components/viz";
import { MainScreen } from "@/components/main-screen";
import type { Song, VizType } from "@/types";
import { toast } from "sonner";
import { useLocalStorage } from "react-use";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import { getFileUrl } from "@/lib/file-url";
import { PlayButton } from "@/components/play-button";

function App() {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

  const [isPlaying, setIsPlaying] = useState(false);

  const player = useRef<MIDIPlayer | null>(null);
  const [selectedFile, setSelectedFile] = useSelectedFile();
  const selectedFileUrl = selectedFile && getFileUrl(selectedFile);
  const { data: path, isLoading } = useSWR(
    selectedFileUrl,
    async (selectedFileUrl) => {
      const res = await fetch(selectedFileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      player.current = new MIDIPlayer();

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.current?.startLoad(song, resolve)
      );

      const path = calculatePath(song, SPEED, vizType === "STARS" ? 4 : 14); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      setIsPlaying(false);

      return path;
    },
    {
      errorRetryCount: 0,
      onError(err, key, config) {
        console.error(err, key, config);
        toast.error("Error loading file, try again");
        setSelectedFile(null);
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (!selectedFileUrl) {
      player.current?.stop();
    }
  }, [selectedFileUrl]);

  const onClickPlay = () => {
    setIsPlaying(true);
    if (!MUTE) {
      player.current?.startPlay(() => {
        toast("Hope you had fun, pick another song!");
        setSelectedFile(null);
        setIsPlaying(false);
      });
    }
  };

  return path ? (
    isPlaying ? (
      <Viz path={path} />
    ) : (
      <PlayButton onClickPlay={onClickPlay} />
    )
  ) : (
    <MainScreen isLoading={isLoading} />
  );
}

export default App;
