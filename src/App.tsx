import { useEffect, useRef } from "react";
import useSWR from "swr";
import { MIDIPlayer } from "@/lib/midi/player";
import { MIDIFile } from "@/lib/midi/file";
import { calculatePath } from "@/lib/path";
import {
  INCLUDE_BEATS,
  INITIAL_VIZ_TYPE,
  MUTE,
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

function App() {
  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

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

      if (!MUTE) {
        player.current?.startPlay(() => {
          toast("Hope you had fun, pick another song!");
          setSelectedFile(null);
        });
      }

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

  return path ? <Viz path={path} /> : <MainScreen isLoading={isLoading} />;
}

export default App;
