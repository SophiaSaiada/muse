import { useState } from "react";
import useSWR from "swr";
import { MIDIPlayer } from "@/lib/midi/player";
import { MIDIFile } from "@/lib/midi/file";
import { calculatePath } from "@/lib/path";
import {
  INCLUDE_BEATS,
  INITIAL_VIZ_TYPE,
  MIDI_FILES,
  MUTE,
  SPEED,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import { Viz } from "@/components/viz";
import { MainScreen } from "@/components/main-screen";
import type { Song, VizType } from "@/types";
import { toast } from "sonner";
import { useLocalStorage } from "react-use";

function App() {
  const [selectedFile, setSelectedFile] = useState<
    (typeof MIDI_FILES)[number] | null
  >(null);

  const [vizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );
  const { data: path, isLoading } = useSWR(
    selectedFile,
    async (selectedFile) => {
      const res = await fetch(selectedFile.url);
      const arrayBuffer = await res.arrayBuffer();
      const midiFile = new MIDIFile(arrayBuffer);

      const song: Song = midiFile.parseSong();

      if (!INCLUDE_BEATS) {
        song.beats = [];
      }

      const player = new MIDIPlayer();

      const loadingSongIntoPlayerPromise = new Promise((resolve) =>
        player.startLoad(song, resolve)
      );

      const path = calculatePath(song, SPEED, vizType === "STARS" ? 4 : 14); // TODO: calculate on a service worker

      await loadingSongIntoPlayerPromise;

      if (!MUTE) {
        player.startPlay(() => {
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
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return path ? (
    <Viz path={path} />
  ) : (
    <MainScreen
      onSelectFile={setSelectedFile}
      isLoading={isLoading}
      selectedFile={selectedFile}
    />
  );
}

export default App;
